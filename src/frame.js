var callbacks = [];

export default function frame(callback) {
  callbacks.push(callback);
}

function onFrame() {
  callbacks.forEach(callback => callback());
  requestAnimationFrame(onFrame);
}

onFrame();
