precision mediump float;

attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform mat4 normalMat;
uniform float time;
uniform sampler2D heightMap;
uniform float res;
uniform float waterLevel;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
varying vec3 pos;
varying float height;
varying float fogValue;
varying float shadow;

// https://stackoverflow.com/questions/18453302/how-do-you-pack-one-32bit-int-into-4-8bit-ints-in-glsl-webgl
const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
const vec4 bitDec = 1./bitEnc;
float DecodeFloatRGBA (vec4 v) {
    return dot(v, bitDec);
}

float getNeighbourShadow(vec2 offset)
{
    const float pas = 1.0/500.0;
    const float rate = 1.0;
    float maxDiffHeight = 0.0;
    float maxHeightDistance = 0.0;
    float x = uv.x + offset.x*pas;
    for (float i = 0.0; i < 1.0; i+=pas)
    {
        // return (uv.x <= 0.5) ? 0.0:1.0;
        if(i > x && offset.y > 0.0 && offset.y < 1.0) 
        {

            float diff = i-x;
            float terrainHeight = DecodeFloatRGBA(texture2D(heightMap, vec2(i, uv.y + offset.y/255.0)));
            float lightHeight = height + diff*rate;
            float heightDiff = terrainHeight - lightHeight;
            if (heightDiff > maxDiffHeight)
            {
                maxHeightDistance = diff/terrainHeight; // proportion of max shadow distance;
                maxHeightDistance = smoothstep(0.1, 0.9, maxHeightDistance);
                maxDiffHeight = heightDiff;
                maxDiffHeight /= maxHeightDistance;
            }
        }
    }
    return min(maxDiffHeight, 1.0);
}

float getShadow()
{
    const float pas = 1.0/500.0;
    const float rate = 1.0;
    float maxDiffHeight = 0.0;
    float maxHeightDistance = 0.0;
    float x = uv.x;
    for (float i = 0.0; i < 1.0; i+=pas)
    {
        if(i > x+pas) 
        {

            float diff = i-x;
            float terrainHeight = DecodeFloatRGBA(texture2D(heightMap, vec2(i, uv.y)));
            float lightHeight = height + diff*rate;
            float heightDiff = terrainHeight - lightHeight;
            if (heightDiff > maxDiffHeight)
            {
                maxHeightDistance = diff/terrainHeight; // proportion of max shadow distance;
                maxHeightDistance = smoothstep(0.0, 0.8, maxHeightDistance);
                maxDiffHeight = heightDiff;
                maxDiffHeight /= maxHeightDistance;
            }
        }
    }
    float result = min(maxDiffHeight, 1.0);
    float p1 = getNeighbourShadow(vec2(0.0, 1.0));
    float p2 = getNeighbourShadow(vec2(0.0, -1.0));
    float p3 = getNeighbourShadow(vec2(1.0, 0.0));
    float p4 = getNeighbourShadow(vec2(-1.0, 0.0));
    return 1.0 - (2.0*result + p1 + p2 + p3 + p4)/6.0;
}

// Sobel filter to get normals from heightmap
vec3 getNormal() {
    float tempAmp = 1.0;

    float d = 1.0/res;
    float p0 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x - d, uv.y - d)));
    float p1 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x, uv.y - d)));
    float p2 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x + d, uv.y - d)));
    float p3 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x - d, uv.y)));
    float p5 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x + d, uv.y)));
    float p6 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x - d, uv.y + d)));
    float p7 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x, uv.y + d)));
    float p8 = DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x + d, uv.y + d)));

    float gx = p0 + 2.0*p1 +p2 -p6 - 2.0*p7 - p8;
    float gy = p0 - p2 + 2.0*p3 - 2.0*p5 + p7-p8;


    if(DecodeFloatRGBA(texture2D(heightMap, uv)) <= waterLevel) 
    {
        // water amp hack
        tempAmp /= 8.0;
    }
    vec3 va = normalize(vec3(8.0*d, 0.0, tempAmp * gx));
    vec3 vb = normalize(vec3(0.0, 8.0*d, tempAmp * gy));

    return normalize(cross(va, vb));
}

// Custom falloff function for fog
float getFogValue()
{
    vec2 pos = vec2(uv.x, uv.y);
    
    vec2 diff = (pos - vec2(0.5));
    float avg = ((0.5 - uv.x+0.5) + (0.5 - uv.y+0.5))/2.0;
    float side = min((0.5 - uv.x+0.5), (0.5 - uv.y+0.5));
    float dist = min(avg, side);

    return 1.0-exp(-800.0*dist*dist);
}

void main() {
    vec3 p = position;
    // Use amplitude as normal to have a uniform quad when flat
    raw_normal = vec3(0.0, 0.0, 0.001);

    if (uv.x != 0.0 && uv.y != 0.0 && uv.x != 1.0 && uv.y != 1.0)
    {
        height = max(DecodeFloatRGBA(texture2D(heightMap, vec2(uv.x, uv.y))), waterLevel);
        p.z = p.z + height;
        
        float delta = 1.2/res;
        if(uv.x > (0.0 + delta) && uv.y > (0.0 + delta) && uv.x < (1.0 - delta) && uv.y < (1.0 - delta))
        {
            raw_normal = getNormal();
        }
    }

    gl_Position = projection * model * vec4( p, 1.0 );
    normal = vec3(normalMat * vec4(-1.0 * raw_normal, 1.0));
    fogValue = getFogValue();
    fcolor = color;
    shadow = getShadow();
    pos = vec3(gl_Position);
}