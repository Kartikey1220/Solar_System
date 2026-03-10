
const orbiting = document.querySelector('.orbiting-object');
const center = document.querySelector('.center-object');

// Get center coordinates after image loads
function getCenterCoords() {
  const rect = center.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

let angle = 0;
const radius = 120;

function animate() {
  const { x: centerX, y: centerY } = getCenterCoords();
  const x = centerX + radius * Math.cos(angle) - orbiting.offsetWidth / 2;
  const y = centerY + radius * Math.sin(angle) - orbiting.offsetHeight / 2;
  orbiting.style.left = `${x}px`;
  orbiting.style.top = `${y}px`;
  angle += 0.02;
  requestAnimationFrame(animate);
}

animate();


