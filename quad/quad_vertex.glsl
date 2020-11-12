attribute vec3 position;
attribute vec4 color;

uniform mat4 model;
uniform mat4 projection;
uniform float time;
uniform sampler2D heightMap;

varying vec4 fcolor;

void main() {
    vec3 pos = position;
    pos.z = pos.z - texture2D(heightMap, vec2(position.x, position.y)).x;
    gl_Position = projection * model * vec4( pos, 1.0 );

    fcolor = color;
}