precision mediump float;

uniform float Ka;
uniform float Kd;
uniform float Ks;
uniform float Sv;
uniform int mode;

uniform vec3 lightColorA;
uniform vec3 lightColorD;
uniform vec3 lightDir;

varying vec4 fcolor;
varying vec3 normal;
varying vec3 raw_normal;
varying vec3 pos;

vec4 getLightColor() {
    vec3 N = normalize(normal);
    vec3 L = normalize(lightDir);

    float lambertian = max(dot(N, L), 0.0);

    float specular = 0.0;
    if(lambertian > 0.0) {
        vec3 R = reflect(-L, N);
        vec3 V = normalize(-pos);
        float specAngle = max(dot(R, V), 0.0);
        specular = pow(specAngle, Sv);
    }

    return vec4(Ka * lightColorA + Kd * lambertian * lightColorD + Ks * specular * lightColorD, 1.0);
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
        gl_FragColor = fcolor;
    }
    else if(mode == 3)
    {
        gl_FragColor = vec4(0.25, 0.53, 0.96, 1.0);
    }
}