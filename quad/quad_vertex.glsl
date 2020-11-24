precision mediump float;

attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform mat4 normalMat;
uniform mat4 inverseMat;
uniform float time;
uniform sampler2D heightMap;
uniform float res;
uniform float waterLevel;
uniform float shadows;
uniform float rotation;
uniform float movement;
uniform vec3 light;


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

float getShadow(vec2 offset, vec3 light)
{
    vec3 direction = normalize(vec3(-light.x, light.y, light.z));
    const float MAX_RES = 1132.0; // diag length of max res (800.0)
    float rate = (direction/(length(direction.xy))).z; // determined by light.z
    float maxDiffHeight = 0.0;
    float cumulative = 0.0;
    float uv_step = 1.0/res;

    for (float i = 0.0; i < MAX_RES; ++i)
    {
        float lightStep = min(pow(i,1.5), 3.0*i)*uv_step;
        vec2 newTerrainCoords = uv + uv_step*offset + lightStep*direction.xy;
        if(newTerrainCoords.x >1.0 || newTerrainCoords.y >1.0 || newTerrainCoords.x < 0.0 || newTerrainCoords.y < 0.0) break; // out of bounds
        else
        {
            float terrainHeight = DecodeFloatRGBA(texture2D(heightMap, newTerrainCoords));
            float lightHeight = height + lightStep*rate;
            float heightDiff = terrainHeight - lightHeight;
            if (heightDiff > maxDiffHeight)
            {
                maxDiffHeight = heightDiff;
                cumulative += heightDiff*terrainHeight/lightStep;// no falloff on short distances;
            }
        }
    }
    return 1.0 - min(cumulative, 1.0);
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

vec2 rotate(vec2 v, float a) {
    // inexpensive 2D rotation
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
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
            
            bool shadowEnabled = shadows == 0.0;
            if (shadowEnabled)
            {
                // Light rotation from slider
                vec3 LD = (inverseMat*vec4(light, 1.0)).xyz;
                // LD.xy = rotate(LD.xy, -rotation);

                // Shadow component
                shadow = getShadow(vec2(0.0), LD);
            }
        }

    }

    gl_Position = projection * model * vec4( p, 1.0 );
    normal = vec3(normalMat * vec4(-1.0 * raw_normal, 1.0));
    fogValue = abs(movement) > 0.0001 ? getFogValue() : 1.0;
    fcolor = color;
    pos = vec3(gl_Position);
}