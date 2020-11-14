attribute vec3 position;
attribute vec4 color;
attribute vec2 uv;

uniform mat4 model;
uniform mat4 projection;
uniform mat4 normalMat;
uniform float time;
uniform float res;
uniform float amp;
uniform sampler2D heightMap;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
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

    float gx = p0 + 2.0*p1 +p2 -p6 - 2.0*p7 - p8;
    float gy = p0 - p2 + 2.0*p3 - 2.0*p5 + p7-p8;

    vec3 va = normalize(vec3(8.0*d, 0.0, amp * gx));
    vec3 vb = normalize(vec3(0.0, 8.0*d, amp * gy));

    return normalize(cross(va, vb));
}

vec3 getBorderNormal(float delta) {
    vec3 n = vec3(0.0);
    if (uv.x < delta) {
        n.y = 1.0;
    } else if (uv.x > 1.0 - delta) {
        n.y = -1.0;
    }

    if (uv.y < delta) {
        n.x = 1.0;
    } else if (uv.y > 1.0 - delta) {
        n.x = -1.0;
    }

    return n;
}

void main() {
    vec3 p = position;

    // Use amplitude as normal to have a uniform quad when flat
    raw_normal = vec3(0.0, 0.0, -amp + 0.001);

    if (uv.x != 0.0 && uv.y != 0.0 && uv.x != 1.0 && uv.y != 1.0)
    {
        p.z = p.z + amp * (texture2D(heightMap, vec2(uv.x, uv.y)).x);
        
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