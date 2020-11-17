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

varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
varying vec3 pos;
varying float height;
const float waterLevel = 0.1;

// https://stackoverflow.com/questions/18453302/how-do-you-pack-one-32bit-int-into-4-8bit-ints-in-glsl-webgl
const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
const vec4 bitDec = 1./bitEnc;
float DecodeFloatRGBA (vec4 v) {
    return dot(v, bitDec);
}

vec3 getNormal() {
    float tempAmp = 1.0;
    if(DecodeFloatRGBA(texture2D(heightMap, uv)) <= waterLevel) {
        // water hack
        tempAmp /= 8.0;
    }
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

    vec3 va = normalize(vec3(8.0*d, 0.0, tempAmp * gx));
    vec3 vb = normalize(vec3(0.0, 8.0*d, tempAmp * gy));

    return normalize(cross(va, vb));
}

void main() {
    vec3 p = position;

    // Use amplitude as normal to have a uniform quad when flat
    raw_normal = vec3(0.0, 0.0, 0.001);

    if (uv.x != 0.0 && uv.y != 0.0 && uv.x != 1.0 && uv.y != 1.0)
    {
        height = max(DecodeFloatRGBA((texture2D(heightMap, vec2(uv.x, uv.y)))), waterLevel);
        p.z = p.z + height;
        
        float delta = 1.2/res;
        if(uv.x > (0.0 + delta) && uv.y > (0.0 + delta) && uv.x < (1.0 - delta) && uv.y < (1.0 - delta))
        {
            raw_normal = getNormal();
        }
    }

    gl_Position = projection * model * vec4( p, 1.0 );
    normal = vec3(normalMat * vec4(-1.0 * raw_normal, 1.0));

    fcolor = color;
    pos = vec3(gl_Position);
}