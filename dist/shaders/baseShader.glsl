precision mediump float;

uniform sampler2D src;
uniform vec2 offset;
uniform vec2 resolution;

void main() {
  vec2 uv = (gl_FragCoord.xy - offset) / resolution;
  gl_FragColor = texture2D(src, uv);
}