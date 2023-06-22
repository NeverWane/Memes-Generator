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
    const draws = getDraws()
    const ratio = getRatio()
    if (ratio < 1) {
        for (const draw of draws) {
            draw.element.style.left = draw.regX * ratio
            draw.element.style.top = draw.regY * ratio
            _getDrawById(draw.id).style['font-size'] = draw.fontSize * ratio + 'px'
            console.log(draw.fontSize * ratio + 'px')
        }
    }
}

function drawImage(img, x, y) {
    if (img) {
        const ratio = getRatio()
        x -= ratio * (img.width / 2)
        y -= ratio * (img.height / 2)
        gCtx.drawImage(img, x, y, (ratio * img.width), (ratio * img.height))
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
        oninput="updateForm(this)" onclick="updateForm(this); setCurrContainer(this)">Enter Caption</div>
    </section>`
    document.querySelector('.canvas-container').insertAdjacentHTML('beforeend', captionContainer)
    addDraw(document.getElementById(`caption-container${gCount}`), gCount, drawCaption)
    const elContainer = getCurrContainer()
    const ratio = getRatio()
    elContainer.regX = (elContainer.offsetLeft / ratio)
    elContainer.regY = (elContainer.offsetTop / ratio)
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
        const elDraw = _getCurrentDraw()
        const minX = parseFloat(elDraw.offsetWidth / 2)
        const maxY = parseFloat(elDraw.offsetHeight)
        const newPos = { x: gPos.x + gMoveDif.x, y: gPos.y + gMoveDif.y }
        if (isInRange(minX, gCanvas.width - minX, newPos.x)) {
            container.style.left = (newPos.x) + 'px'
        }
        if (isInRange(0, gCanvas.height - maxY, newPos.y)) {
            container.style.top = (newPos.y) + 'px'
        }
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
    const container = getCurrContainer()
    container.fontSize = settings['font-size']
    settings['font-size'] *= getRatio()
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
    document.getElementById('font-size').value = (elCapt.style['font-size'].replace('px', '') / getRatio())
    document.getElementById('color').value = rgbToHex(elCapt.style.color)
    document.getElementById('-webkit-text-stroke-color').value = rgbToHex(elCapt.style['-webkit-text-stroke-color'])
}

function onResize() {
    const img = getMeme().img
    const ratio = updateRatio(window.innerWidth, window.innerHeight - 100)
    gCanvas.width = ratio * img.width
    gCanvas.height = ratio * img.height
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

function _getDrawById(id) {
    return document.getElementById(`canvas-text${id}`)
}

function isInRange(min, max, num) {
    return num >= min && num <= max
}