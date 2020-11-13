attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform float time;
uniform float res;
uniform float amp;
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

    float gx = p0 - p2 + 2.0*p3 - 2.0*p5 + p7-p8;
    float gy = p0 + 2.0*p1 +p2 -p6 - 2.0*p7 - p8;

    vec3 va = normalize(vec3(1.0 * d, 0.0, amp * gx));
    vec3 vb = normalize(vec3(0.0, 1.0 * d, amp * gy));

    return cross(vb, va);
}

void main() {
    vec3 p = position;
    normal = vec3(0.0, 0.0, -1.0);

    float b = 0.01;
    if (uv.x > b && uv.y > b && uv.x < 1.0-b && uv.y < 1.0-b)
    {
        p.z = amp * (p.z + (1.0 - texture2D(heightMap, vec2(uv.x, uv.y)).x));
        normal = getNormal();
    }
    
    gl_Position = projection * model * vec4( p, 1.0 );
    normal = vec3(model * vec4(normal, 1.0));

    fcolor = color;
    pos = vec3(gl_Position);
}