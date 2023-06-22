'use strict'

let gCanvas
let gCtx
let gMouseDown = false
let gCount = 0

const gPos = {
    x: 0,
    y: 0
}

const gMoveDif = {
    x: 0,
    y: 0,
}

const drawMap = {
    caption: onAddCaption,
}

const gCaptionStyles = ['font-family', 'font-size', 'color', '-webkit-text-stroke-color']

function onInit() {
    gCanvas = document.querySelector('#canvas')
    gCtx = gCanvas.getContext('2d')
    window.addEventListener('resize', onResize)
    window.addEventListener('mouseup', onMouseUp)
    onmousemove = onMouseMove
    loadLocalImg('images/intrusive.jpg')
}

function renderMeme() {
    const meme = getMeme()
    if (!meme) return
    drawMeme(meme)
}

function drawMeme(meme) {
    drawImage(meme.img, gCanvas.width / 2, gCanvas.height / 2)
}

function drawImage(img, x, y) {
    if (img) {
        x -= img.width / 2
        y -= img.height / 2
        gCtx.drawImage(img, x, y, img.width, img.height)
    }
}

function onAddDraw(type) {
    drawMap[type]()
    renderMeme()
}

function onAddCaption() {
    const captionContainer =
        `<section id="caption-container${gCount}" class="caption-container flex flex-column align-center">
    <div class="move" id="move${gCount}" onmousedown="onMouseDown(this)" style="background-image: url('images/move.png');"></div>
    <div id="canvas-text${gCount}" role="textbox" contenteditable="true" class="canvas-text"
        oninput="updateForm(this)" onclick="updateForm(this)">Enter Caption</div>
    </section>`
    document.querySelector('.canvas-container').insertAdjacentHTML('beforeend', captionContainer)
    addDraw(document.getElementById(`caption-container${gCount}`), gCount, drawCaption)
    gCount++
    onSetSettings()
}

function drawCaption(capt) {
    gCtx.lineWidth = 2
    gCtx.strokeStyle = capt.stroke
    gCtx.fillStyle = capt.fill
    gCtx.font = `${capt.fontSize}px ${capt.font}`
    gCtx.textAlign = 'center'
    gCtx.textBaseline = 'middle'
    gCtx.fillText(capt.caption, capt.x + ((+capt.width) / 2), capt.y + (+capt.height) + 12.5)
    gCtx.strokeText(capt.caption, capt.x + ((+capt.width) / 2), capt.y + (+capt.height) + 12.5)
}

function onMouseDown() {
    gMouseDown = true
    const container = getCurrContainer().element
    gMoveDif.x = parseFloat(container.offsetLeft) - gPos.x
    gMoveDif.y = parseFloat(container.offsetTop) - gPos.y
}

function onMouseUp() {
    gMouseDown = false
}

function onMouseMove(ev) {
    gPos.x = ev.x
    gPos.y = ev.y
    if (gMouseDown) {
        const container = getCurrContainer().element
        container.style.left = (gPos.x + gMoveDif.x) + 'px'
        container.style.top  = (gPos.y + gMoveDif.y) + 'px'
    }
}

function onSetSettings(form) {
    if (!getCurrContainer()) return
    if (!form) {
        form = document.querySelector('.settings-container')
    }
    const settings = new FormData(form)
    updateCaption(Object.fromEntries(settings))
}

function updateCaption(settings) {
    settings['font-size'] += 'px'
    const caption = _getCurrentDraw()
    if (caption) {
        for (let setting in settings) {
            if (setting === 'innerText') {
                caption[setting] = settings[setting]
            } else {
                caption.style.setProperty(setting, settings[setting])
            }
        }
    }
}

function updateForm(elCapt) {
    document.getElementById('innerText').value = elCapt.innerText
    document.getElementById('font-family').value = elCapt.style['font-family']
    document.getElementById('font-size').value = elCapt.style['font-size'].replace('px', '')
    document.getElementById('color').value = rgbToHex(elCapt.style.color)
    document.getElementById('-webkit-text-stroke-color').value = rgbToHex(elCapt.style['-webkit-text-stroke-color'])
}

function onResize() {
    const meme = getMeme()
    gCanvas.width = meme.img.width
    gCanvas.height = meme.img.height
    renderMeme()
}

function loadLocalImg(path) {
    const img = new Image()
    img.src = path
    img.onload = () => {
        onImageReady(img)
    }
}

function onImageReady(img) {
    createMeme(img)
    onResize()
    onAddDraw('caption')
}

function rgbToHex(strRGB) {
    let rbgNums = strRGB.replace('rgb(', '').replace(')', '').replace(',', '').split(' ')
    return `#${numToHex(parseInt(rbgNums[0]))}${numToHex(parseInt(rbgNums[1]))}${numToHex(parseInt(rbgNums[2]))}`
}

function numToHex(num) {
    const hex = num.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}

function _getCurrentDraw() {
    const currId = getCurrContainer().id
    return document.getElementById(`canvas-text${currId}`)
}