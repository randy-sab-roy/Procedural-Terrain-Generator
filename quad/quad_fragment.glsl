precision mediump float;
uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Sv;
uniform int mode;
uniform sampler2D heightMap;


varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
varying vec3 pos;
varying float height;

const float snowLevel = 0.6;
const float waterLevel = 0.1;
const vec3 waterColor = vec3(0.0,0.11,0.22);
const vec3 sandColor = vec3(0.76, 0.69, 0.5);
const vec3 rockColor = vec3(0.3, 0.3, 0.3);
const vec3 snowColor = vec3(0.8, 0.8, 0.8);
const vec3 grasscolor = vec3(0.15, 0.25, 0.11);
const vec3  lightColorA = vec3(1, 1, 0.97);
const vec3  lightColorD = vec3(1, 1, 0.94);
const vec3  lightDir = vec3(0.5, -1, 1);

vec4 getLightColor() {
    vec3 N = normalize(normal);
    vec3 L = normalize(lightDir);

    vec3 material_color;
    if (height <= waterLevel+0.0001) {
        material_color = waterColor;

    }
    else if (height <= waterLevel+0.01)
    {
        material_color = sandColor;
    }
    else if (raw_normal.z<0.6)
    {
        material_color = rockColor;
    }
    else if (height >= snowLevel)
    {
        material_color = snowColor;
    }
    else
    {
        material_color = grasscolor;
    }

    float cap = 0.6;
    material_color *= (height*cap)+cap;
    float lambertian = max(dot(N, L), 0.0);
    float materialSv = Sv;
    float specular = 0.0;
    if(lambertian > 0.0) {
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-pos);
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, materialSv);
    }
    return vec4(Ka * material_color + Kd * lambertian * material_color + Ks * specular * material_color, 1.0);
}

void main() {
    if (mode == 0)
    {
        gl_FragColor = getLightColor();
    }
    else if(mode == 1)
    {
        gl_FragColor = vec4(normalize(abs(raw_normal)), 1.0);    
    }
    else if (mode == 2)
    {
        gl_FragColor = Ka * fcolor;
    }
    else if(mode == 3)
    {
        gl_FragColor = Ka * vec4(0.25, 0.53, 0.96, 1.0);
    }
}