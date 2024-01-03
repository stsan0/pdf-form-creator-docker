// Create editable field
export default async function createEditableField(rect, pageIndex, className, inner, scale = 2) {
    let x = rect.x;
    let y = rect.y;
    let width = rect.width;
    let height = rect.height;
    const fieldText = document.createElement('div');
    //make sure its absolute
    fieldText.style.position = 'absolute';

    const pageHeight = 1584;
    const pageIndexOffset = pageIndex;

    fieldText.style.left = (x) * scale + 'px';
    fieldText.style.bottom = (y + pageHeight / scale * pageIndexOffset) * scale + 'px';
    // turn width and height into strings, so we can check for "px"
    width = width.toString().replace('px', '') * 1 * scale;
    width += 'px';
    height = height.toString().replace('px', '') * 1 * scale;
    height += 'px';
    // If the width and height do not have "px" at the end, add it
    fieldText.style.width = width;
    fieldText.style.height = height;
    fieldText.draggable = true;
    //console.log("position is " + fieldText.style.left + " " + fieldText.style.bottom)
    if (inner == 'undefined' || inner == null) {
        inner = ' ';
    }
    if (inner == true || inner == false) {
        inner = inner.toString();
        // turn true into a checkmark
        if (inner == 'true') {
            inner = 'true';
        }
        // turn false into an empty string
        else {
            inner = '';
        }
    }
    // if inner is a string[]
    if (inner instanceof Array) {
        inner = inner.join('\n');
    }

    fieldText.innerText = inner;
    fieldText.text = inner;

    // add a datamember for the div, keep id as editable-field
    fieldText.id = 'editable-field';
    if (className == 'editable-field' || !className) {
        className = prompt("Prior name is " + className + ". Please enter a name for the field");
        console.log(className)
    }
    fieldText.setAttribute('data-field', className);

    // use the html font size, font color, font style values to update the editable-field's font properties
    const fontSize = document.getElementById('fontSize').value;
    const fontColor = document.getElementById('fontColor').value;
    const fontStyle = document.getElementById('fontStyle').value;
    const fontFamily = document.getElementById('fontFamily').value;
    const fontWeight = document.getElementById('fontWeight').value;
    updateTextFieldFontProperties(fieldText, fontSize, fontColor, fontStyle, fontFamily, fontWeight);
    //field.appendChild(fieldText);


    const tag = document.createElement('span');
    tag.className = "font-control fa fa-edit";
    tag.innerHTML = "";

    tag.addEventListener('click', function (e) {
        efb = e.target.parentElement;
        // TODO: make the tag see the parent element after the first time used for editing
        console.log(e.target);
        console.log(efb);
        openModal(document.getElementById('fontControls').innerHTML, 'Editing ' + efb.innerText);
        let mmodal = document.querySelector('.modal-body');
        // change the data-field of the modal to the editable-field's data-field using efb
        mmodal.querySelector('#dataField').value = efb.getAttribute('data-field');
        // change the innerText of the modal to the editable-field's innerText using efb
        mmodal.querySelector('#innerText').value = efb.innerText;
        console.log(" we are changing " + efb.getAttribute('data-field') + " and " + efb.innerText);

        mmodal.querySelector('#fontSize').value = efb.style.fontSize.replace('px', '');
        //console.log(efb.style.fontFamily);
        mmodal.querySelector('#fontColor').value = RGBToHex(efb.style.color);
        mmodal.querySelector('#fontFamily').value = efb.style.fontFamily.replace(/"/g, '');
        mmodal.querySelector('#fontStyle').value = efb.style.fontStyle;
        mmodal.querySelector('#fontWeight').value = efb.style.fontWeight;
    });


    fieldText.appendChild(tag);

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
        // Make the click function = to tag's click function 
        //console.log(event.target.getElementsByClassName('span'))
        event.target.getElementsByClassName('span');
        console.log("clicking " + event.target.id);
        // click the tag, which is a child of the editable-field
        //tag.click();
    })
    fieldText.addEventListener('dragstart', function (event) {
        //const target = event.target.getBoundingClientRect();
        //startX = event.clientX - target.x;
        //startY = event.clientY - target.y;
        //event.target.remove();
        dragging = true;
        lastDrag = event.target;
    });

    return fieldText;
}

// Function to update the text field with user-defined font properties
function updateTextFieldFontProperties(textField, fontSize, fontColor, fontStyle, fontFamily, fontWeight) {
    // get the text field from the toolbox and update its font properties
    //console.log("updateTextFieldFontProperties: " + fontSize + " " + fontColor + " " + fontStyle + " " + fontFamily)
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
        dragging = true;
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

pdfContainer.addEventListener('dragstart', function (event) {
    event.preventDefault();
    dragging = true;
}
);

// Add event listener for canvas drop
pdfContainer.addEventListener('drop', function (event) {
    event.preventDefault();
    dragging = false;
    if (lastDrag == null) {
        // generate a new field with the toolbox field's name
        // and the canvas' x and y coordinates
        console.log("lastDrag is null")
        let width = 100;
        let height = 50;
        let x = (event.clientX - event.target.getBoundingClientRect().x) / 2;
        let y = (event.target.getBoundingClientRect().bottom - event.clientY) / 2;
        let pageNumber = event.target.dataset.pageNumber;
        // x, y, width, height, pageRectangle, pageNumber, name, value, scale
        const editableField = createEditableField({ x, y, width, height }, pageNumber, event.target.dataset.fieldName, '   ').then(function (editableField) {
            canvas.appendChild(editableField);
        });
        return;
    }
    if (lastDrag.id == 'editable-field') {
        let className = lastDrag.getAttribute('data-field');
        console.log("dropping : " + className + " on " + lastDrag.parentElement.parentElement.id)
        console.log("Dimensions: " + lastDrag.style.width + " " + lastDrag.style.height)
        const offsetX = event.clientX - canvas.getBoundingClientRect().left;
        const offsetY = event.clientY - canvas.getBoundingClientRect().top;
        const fieldName = lastDrag.text; // TODO: the vertical position is using top, not bottom.
        lastDrag.style.left = offsetX + 'px';
        lastDrag.style.top = offsetY + 'px';
    }
    lastDrag = null;
});

// Prevent default behavior to allow drop
pdfContainer.addEventListener('dragover', function (event) {
    event.preventDefault();
    dragging = false;
});

pdfContainer.onmousemove = function (e) {
    if (dragging == false) return;
    e.preventDefault();
    let pos1 = e.clientX - startX - canvas.getBoundingClientRect().left;
    let pos2 = e.clientY - startY - canvas.getBoundingClientRect().top;
    //console.log("moving " + lastDrag.id + " to " + pos1 + " " + pos2)
    lastDrag.style.left = pos1 + 'px';
    lastDrag.style.top = pos2 + 'px';
}

// Add event listener for when mouse button is released
pdfContainer.addEventListener('mouseup', function (event) {
    dragging = false;
    lastDrag = null;

});

