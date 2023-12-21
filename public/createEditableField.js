// Create editable field
export default async function createEditableField(x, y, className, inner, width, height, scale) {
    const fieldText = document.createElement('div');
    // TODO: include the constructor name in the data-field attribute, so that 
    // we can use it to create the correct field type when we are editing the form
    // offset the field by the x and y values of the iframe to get the correct position
    fieldText.style.left = x * scale + 'px';
    fieldText.style.bottom = y * scale + 'px';

    if (inner == 'undefined' || inner == null) {
        inner = ' ';
    }
    fieldText.innerText = inner;
    fieldText.text = inner;
    // add a datamember for the div, keep id as editable-field
    fieldText.id = 'editable-field';
    if (className == 'editable-field' || !className) {
        className = prompt("Prior name is " + className + ". Please enter a name for the field", console.log(className));
    }
    fieldText.setAttribute('data-field', className);
    // turn width and height into strings, so we can check for "px"
    width = width.toString();
    height = height.toString();
    // If the width and height do not have "px" at the end, add it
    if (width.includes('px') != true) {
        width = width + 'px';
        fieldText.style.width = width;
    }
    else {
        fieldText.style.width = width;
    }
    if (height.includes('px') != true) {
        height = height + 'px';
        fieldText.style.height = height;
    }
    else {
        fieldText.style.height = height;
    }

    fieldText.draggable = true;
    // use the html font size, font color, font style values to update the editable-field's font properties
    const fontSize = document.getElementById('fontSize').value;
    const fontColor = document.getElementById('fontColor').value;
    const fontStyle = document.getElementById('fontStyle').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const fontWeight = document.getElementById('fontWeight').value;
    updateTextFieldFontProperties(fieldText, fontSize, fontColor, fontStyle, fontFamily, fontWeight);
    //field.appendChild(fieldText);

    fieldText.addEventListener('click', function (event) {
        let o = '100px';
        if (event.target.hasAttribute('data-width')) {
            o = event.target.getAttribute('data-width');
        }
        console.log('...' + event.target.style.width, o);
        if (event.target.style.width != o) {
            event.target.setAttribute('data-width', event.target.style.width);

            //console.log('width changed to ' + event.target.style.width);
        }
        const blank = prompt('Fill the name: ', fieldText.innerText);
        if (blank !== null) {
            fieldText.innerText = blank;
            console.log('Updated:', blank);

            // You can send this newName to the server for further processing
        }
    })
    fieldText.addEventListener('dragstart', function (event) {
        //const target = event.target.getBoundingClientRect();
        //startX = event.clientX - target.x;
        //startY = event.clientY - target.y;
        //event.target.remove();
        dragging = true;
        lastDrag = event.target;
    });

    const tag = document.createElement('span');
    tag.className = "font-control fa fa-edit";
    tag.innerHTML = "";

    tag.addEventListener('click', function (e) {
        efb = e.target.parentElement.querySelector('.editable-field');
        openModal(document.getElementById('fontControls').innerHTML, 'Editing ' + efb.innerText);
        let mmodal = document.querySelector('.modal-body');
        mmodal.querySelector('#fontSize').value = efb.style.fontSize.replace('px', '');
        //console.log(efb.style.fontFamily);
        mmodal.querySelector('#fontColor').value = RGBToHex(efb.style.color);
        mmodal.querySelector('#fontFamily').value = efb.style.fontFamily.replace(/"/g, '');
        mmodal.querySelector('#fontStyle').value = efb.style.fontStyle;
        mmodal.querySelector('#fontWeight').value = efb.style.fontWeight;

    });

    fieldText.appendChild(tag);
    return fieldText;
}

// Function to update the text field with user-defined font properties
function updateTextFieldFontProperties(textField, fontSize, fontColor, fontStyle, fontFamily, fontWeight) {
    // get the text field from the toolbox and update its font properties
    console.log("updateTextFieldFontProperties: " + fontSize + " " + fontColor + " " + fontStyle + " " + fontFamily)
    textField.style.fontSize = (fontSize + "px");
    textField.style.color = fontColor;
    textField.style.fontFamily = fontFamily;
    textField.style.fontStyle = fontStyle;
    textField.style.fontWeight = fontWeight;
}

let pdfContainer = document.getElementById('pdf-container');
// Add event listener to capture changes to the name
let dragging = false;
let lastDrag = null;
let startX = null;
let startY = null;
// Add event listener for toolbox field drag start
const toolboxFields = document.querySelectorAll('.editable-field');
toolboxFields.forEach(toolboxField => {
    toolboxField.addEventListener('dragstart', function (event) {
        const target = event.target.getBoundingClientRect();
        lastDrag = event.target;
        startX = event.clientX - target.x;
        startY = event.clientY - target.y;

        if (event.target.parentElement == 'canvas') {

            event.target.remove();
        }
        event.dataTransfer.setData('text/plain', toolboxField.dataset.fieldName);
    });
});

// Add event listener for canvas drop
pdfContainer.addEventListener('drop', function (event) {
    event.preventDefault();
    dragging = false;
    let className = lastDrag.getAttribute('data-field');
    console.log("dropping : " + className + " on " + lastDrag.parentElement.parentElement.id)
    console.log("Dimensions: " + lastDrag.style.width + " " + lastDrag.style.height)
    const offsetX = event.clientX - canvas.getBoundingClientRect().left;
    const offsetY = event.clientY - canvas.getBoundingClientRect().top;
    const fieldName = lastDrag.text;
    if (lastDrag.id == 'editable-field') {
        lastDrag.style.left = offsetX + 'px';
        lastDrag.style.top = offsetY + 'px';
    } else {
        const editableField = createEditableField(offsetX, offsetY, className, fieldName, lastDrag.style.width, lastDrag.style.height).then(function (editableField) {
            canvas.appendChild(editableField);
        });
    }
});

// Prevent default behavior to allow drop
pdfContainer.addEventListener('dragover', function (event) {
    event.preventDefault();
});

document.onmousemove = function (e) {
    if (!dragging) return;
}

