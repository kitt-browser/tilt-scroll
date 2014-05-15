    // The rotation of mobile phone is represented by three angles.
    // For convinience, I use coordinate system instead of rotation angles.
    // In theory, Y axis should be orthogonal on plane of mobile screen.
    // Z axis should be pointing into direction of phone up.
    // X axis should be orthogonal on both Z and Y axes.

    // Current coordinate system is stored, when the user has clicked on the lock button.
    // Coordinate system also representes plane in space.
    // I decided, that movement shouldn't start when plane is deflected from stored plane.
    // MIN_MOTION_THRESHOLD is minimal deflection angle when auto scrolling should be enabled.
    // From that point, the speed of scrolling increases with deflection angle
    // until MAX_MOTION_THRESHOLD angle.
    var MIN_MOTION_THRESHOLD = Math.cos((15) / 180 * Math.PI);
    var MAX_MOTION_THRESHOLD = Math.cos((45) / 180 * Math.PI);
    var MOTION_LENGTH = MIN_MOTION_THRESHOLD - MAX_MOTION_THRESHOLD;
    var MOTION_SPEED = 50;

    var interval;

    // Base coordinate system
    var base = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];
    // Current coordinate system
    var current = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1]
    ];

    function sign(x) {
        return x >= 0 ? 1 : -1;
    }

    /**
     * @param {Number} i
     * @param {Number} j
     * @returns {Number} dot product of columns of base and current matrices.
     */
    function dot(i, j) {
        var sum = 0;
        for (var k = 0; k < 3; k++) {
            sum += base[i][k] * current[j][k];
        }
        return sum;
    }

    /**
     * @returns {Number} movement in x-axis.
     */
    function getDX() {
        var d = (Math.abs(dot(0, 0)) - MIN_MOTION_THRESHOLD) / MOTION_LENGTH;
        if (d >= 0) {
            return 0;
        } else {
            return -Math.min(-d, 1) * sign(dot(2, 0));
        }
    }

    /**
     * @returns {Number} movement in y-axis.
     */
    function getDY() {
        var d = (Math.abs(dot(1, 1)) - MIN_MOTION_THRESHOLD) / MOTION_LENGTH;
        if (d >= 0) {
            return 0;
        } else {
            return Math.min(-d, 1) * sign(dot(2, 1));
        }
    }

    // Register event handler
    window.addEventListener('deviceorientation', function(event) {
        // Obtains rotation angles.

        // Based on code from THREEJS
        var x = event.beta / 180 * Math.PI, y = event.gamma / 180 * Math.PI, z = event.alpha / 180 * Math.PI;
        var a = Math.cos(x), b = Math.sin(x);
        var c = Math.cos(y), d = Math.sin(y);
        var e = Math.cos(z), f = Math.sin(z);

        // Magic code copied from THREEJS.
        // Basically, it rotates coordinate system around z,y, and x axis.
        var ce = c * e, cf = c * f, de = d * e, df = d * f;

        current[0][0] = ce - df * b;
        current[1][0] = -a * f;
        current[2][0] = de + cf * b;

        current[0][1] = cf + de * b;
        current[1][1] = a * e;
        current[2][1] = df - ce * b;

        current[0][2] = -a * d;
        current[1][2] = b;
        current[2][2] = a * c;
    }, true);

    var lastOrientation = window.orientation;

    // Register event handler
    window.addEventListener('orientationchange', function(event) {
        var a = (window.orientation - lastOrientation) / 180 * Math.PI;
        var c = Math.cos(a), s = Math.sin(a);
        for (var i = 0; i < 3; i++) {
            // Rotate coordinate system acording to orientation
            var x = base[0][i], y = base[1][i];
            base[0][i] = +c * x + s * y;
            base[1][i] = -s * x + c * y;
        }
        lastOrientation = window.orientation;
    });


    function browserActionOnClick(lock) {
        if (!lock) {
            // Disable timer
            window.clearInterval(interval);

        } else {
            // Set timer to control scrolling

            interval = window.setInterval(function() {
                var c = Math.cos(window.orientation / 180 * Math.PI), s = Math.sin(window.orientation / 180 * Math.PI);
                var x = getDX(), y = getDY();
                // Rotate movement acording to orientation
                var X = +c * x + s * y;
                var Y = -s * x + c * y;
                $(window).scrollTop($(window).scrollTop() + Y * MOTION_SPEED);
                $(window).scrollLeft($(window).scrollLeft() + X * MOTION_SPEED);
            }, 30);
        }
        // Store current rotated coordinate system.
        for (var i = 0; i < 3; i++)
            for (var j = 0; j < 3; j++)
                base[i][j] = current[i][j];

    }

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse)
    {
        switch (request.cmd)
        {
            // Received on click event
            case 'content.onClick':
                browserActionOnClick(request.lock);
                sendResponse({message: 'OK'});
                break;
            default:
                sendResponse({message: 'Invalid arguments'});
                break;
        }
    });
