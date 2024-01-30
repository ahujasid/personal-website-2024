
/// Spring constants
const stiffness = 0.1;
const damping = 0.9; // Adjust for more or less jiggle

document.querySelectorAll('.string-target').forEach((targetElement, index) => {
    // Create a canvas element for each string
    const canvas = document.createElement('canvas');
    canvas.id = `guitarStringCanvas${index}`;
    canvas.width = targetElement.offsetWidth; // Match the width of the target element
    canvas.height = 50; // Set a fixed height for the string
    canvas.style.position = 'absolute';
    canvas.style.left = targetElement.offsetLeft + 'px';
    canvas.style.top = (targetElement.offsetTop + 16) + 'px';


    // Insert the canvas after the target element
    targetElement.parentNode.insertBefore(canvas, targetElement.nextSibling);

    // Initialize the guitar string on this canvas
    initializeGuitarString(canvas);
});


function initializeGuitarString(canvas) {
    const ctx = canvas.getContext('2d');
    const string = {
        y: canvas.height / 2, 
        tension: 0, 
        targetTension: 0, 
        velocity: 0, 
        mouseX: 0, 
        lastMouseY: 0
    };

    function drawString() {
        const controlY = string.y + string.tension; 
        const controlX = string.mouseX;
        ctx.strokeStyle = 'white';

        ctx.beginPath();
        ctx.moveTo(0, string.y);
        ctx.bezierCurveTo(
            controlX - 50, controlY, 
            controlX + 50, controlY, 
            canvas.width, string.y
        );
        ctx.stroke();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const force = stiffness * (string.targetTension - string.tension);
        const acceleration = force / 1; // Assuming mass = 1
        string.velocity = damping * (string.velocity + acceleration);
        string.tension += string.velocity;

        drawString();

        requestAnimationFrame(animate);
    }

    canvas.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const yDistance = Math.abs(string.y - mouseY);
        const yMovementDirection = string.lastMouseY - mouseY; // Positive if moving down, negative if up

        if (yDistance < 100) {
            const bendStrength = Math.max(0, 20 - yDistance / 2);
            string.targetTension = yMovementDirection > 0 ? -bendStrength : bendStrength;
            string.mouseX = mouseX;
        } else {
            string.targetTension = 0;
        }

        string.lastMouseY = mouseY;
    });

    canvas.addEventListener('mouseout', function() {
        string.targetTension = 0;
    });

    animate();
}