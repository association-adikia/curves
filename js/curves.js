
function ageMonths(date, birthDate) {
    return moment.duration(date.diff(birthDate, "months", true)) / 1;
}


function parseDate(date) {
    return moment(date, "DD/MM/YYYY");
}


var imgData = "";
var imgWidth = 2480, imgHeight = 1748;

var bl = [252, 1415];
var tr = [2085, 203];


function monthToX(month) {
    return bl[0] + (tr[0] - bl[0]) * (month / 60) + 2;
}


function sizeToY(size) {
    return bl[1] + (tr[1] - bl[1]) * ((size - 30) / 30) + 2;
}


var colorb = "#6D9505";
var colorg = "#790463";


function Curves() {
    var canvas = document.getElementById("curves");

    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        canvas.width = imgWidth;
        canvas.height = imgHeight;

        ctx.strokeStyle = colorb;
        ctx.fillStyle = colorb;
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.font = "56px sans-serif";
        ctx.textAlign = "center";

    }

    this.canvas = canvas;
    this.ctx = ctx;
}


Curves.prototype.drawImage = function (url, callback) {
    var img = new Image();
    var that = this;
    img.onload = function() {
        var canvas = that.canvas;
        that.ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        if (callback !== undefined) {
            callback();
            imgData = canvas.toDataURL();
        }
    };
    img.src = url;
};


Curves.prototype.drawText = function (text) {
    var coords = this._rescale(imgWidth / 2, 100);
    this.ctx.fillText(text, coords[0], coords[1]);
};


Curves.prototype._rescale = function (x, y) {
    var x2 = (x / imgWidth) * this.canvas.width;
    var y2 = (y / imgHeight) * this.canvas.height;
    return [x2, y2];
};


Curves.prototype.drawPath = function (path_orig) {
    var ctx = this.ctx;

    var path = [];
    for (var i = 0; i < path_orig.length; i ++) {
        var coords = path_orig[i];
        var x = coords[0], y = coords[1];
        var coords = this._rescale(x, y);
        if (coords[0] > 0 && coords[1] > 0) {
            path.push(coords);
        }
    }

    // Path.
    ctx.beginPath();
    for (var i = 0; i < path.length; i ++) {
        var coords = path[i];
        ctx.lineTo(coords[0], coords[1]);
    }
    ctx.stroke();
    ctx.closePath();

    // Discs.
    for (var i = 0; i < path.length; i ++) {
        var coords = path[i];
        ctx.beginPath();
        ctx.arc(coords[0], coords[1], 10, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
    }

}


function downloadCanvas() {
    var canvas = document.getElementById("curves");
    download(imgData, "courbe.png", "image/png");
}


function getValues() {
    var name = $("#formName").val();
    var birthdate = $("#formBirthdate").val();
    var gender = $("#form input[type='radio']:checked").val();

    var values = [];
    $("#table tbody tr").each(function () {
        var date = $(this).find(".date input").val();
        var value = $(this).find(".value input").val();
        if (date.length > 0 && value.length > 0) {
            values.push([date, value]);
        }
    });

    return {"name": name, "birthdate": birthdate, "gender": gender, "values": values};
}


function draw () {
    var curves = new Curves();
    var data = getValues();
    setCookie(data);

    var birthdate = parseDate(data.birthdate);

    var ageNow = ageMonths(moment(), birthdate);
    var url = "images/hc" + data.gender + ".png";

    curves.drawImage(url, function () {
        var coords = [];
        for (var i = 0; i < data.values.length; i++) {
            var age = ageMonths(parseDate(data.values[i][0]), birthdate);
            var value = (data.values[i][1]);
            coords.push([monthToX(age), sizeToY(value)]);
        }
        // console.log(coords);
        curves.drawPath(coords);
        curves.drawText("Courbe de " + data.name + ", " + ageNow.toFixed(0) + " mois", [400, 50]);
    });
}


function setCookie (data) {
    console.log("Saving", data);
    Cookies.set('adikiaCurveData', data);
}


function loadFromCookie () {
    var data = Cookies.getJSON('adikiaCurveData');
    if (data) {

        // console.log("Loading", data);

        $("#formName").val(data.name);
        $("#formBirthdate").val(data.birthdate);
        $("#formGender" + data.gender).attr("checked", true);

        for (var i = 0; i < data.values.length; i++ ) {
            appendRow(data.values[i][0], data.values[i][1]);
        }
    }

    appendRow("", "");
}


function appendRow (date, value) {
    $("#table").append('<tr><td class="date"><input type="text" value="' + date +
                       '" placeholder="01/01/2018" size="8" /></td><td class="value"><input type="text" value="' + value +
                       '" size="2" placeholder="42" /></td></tr>');
}


$(document).ready(function() {
    $("#table tbody tr").remove();
    loadFromCookie();
    draw();

    $("#form").change(function (e) {
        if ($("#table tr:last td.date input").val() != "") {
            appendRow("", "");
        }
        draw();
    });
});
