attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform float time;
uniform float res;
uniform sampler2D heightMap;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 pos;

vec3 getNormal() {
    float d = 1.0/res;
    float p0 = texture2D(heightMap, vec2(uv.x - d, uv.y - d)).x;
    float p1 = texture2D(heightMap, vec2(uv.x, uv.y - d)).x;
    float p2 = texture2D(heightMap, vec2(uv.x + d, uv.y - d)).x;
    float p3 = texture2D(heightMap, vec2(uv.x - d, uv.y)).x;
    float p5 = texture2D(heightMap, vec2(uv.x + d, uv.y)).x;
    float p6 = texture2D(heightMap, vec2(uv.x - d, uv.y + d)).x;
    float p7 = texture2D(heightMap, vec2(uv.x, uv.y + d)).x;
    float p8 = texture2D(heightMap, vec2(uv.x + d, uv.y + d)).x;

    return vec3(p0-p2+2.0*p3-2.0*p5+p7-p8, p0+2.0*p1+p2-p6-2.0*p7-p8, 0.0);
}

void main() {
    vec3 p = position;
    p.z = p.z + (1.0 - texture2D(heightMap, vec2(uv.x, uv.y)).x);
    gl_Position = projection * model * vec4( p, 1.0 );

    normal = getNormal();
    fcolor = color;
    pos = vec3(gl_Position);
}