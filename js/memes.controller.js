'use strict'

let gCanvas
let gCtx
let gMouseDown = false
let gCount = 0
const gImages = {}

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
    onmousemove = onMouseMove
    createGallery()
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
            draw.element.style.left = draw.regX * ratio + 'px'
            draw.element.style.top = draw.regY * ratio + 'px'
            _getDrawById(draw.id).style['font-size'] = draw.fontSize * ratio + 'px'
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
        const drawContainer = getCurrContainer()
        const container = drawContainer.element
        const elDraw = _getCurrentDraw()
        const minX = parseFloat(elDraw.offsetWidth / 2)
        const maxY = parseFloat(elDraw.offsetHeight)
        const newPos = { x: gPos.x + gMoveDif.x, y: gPos.y + gMoveDif.y }
        const ratio = getRatio()
        if (isInRange(minX, gCanvas.width - minX, newPos.x)) {
            container.style.left = (newPos.x) + 'px'
            drawContainer.regX = newPos.x / ratio
        }
        if (isInRange(0, gCanvas.height - maxY, newPos.y)) {
            container.style.top = (newPos.y) + 'px'
            drawContainer.regY = newPos.y / ratio
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
    document.getElementById('font-size').value = parseInt((elCapt.style['font-size'].replace('px', '') / getRatio()) + 0.1)
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

function createGallery() {
    const elGallery = document.querySelector('.image-gallery')
    for (let i = 1; i <= 27; i++) {
        elGallery.insertAdjacentHTML('beforeend', createImageHTML(i))
        const newElImg = document.getElementById(`image${i}`)
        loadLocalImg(`images/${i}.jpg`, newElImg)
    }
}

function onClickHome() {
    onResetMeme()
    document.querySelector('.main-gallery').classList.remove('hide')
    document.querySelector('.editor').classList.add('hide')
    window.removeEventListener('resize', onResize)
    window.removeEventListener('mouseup', onMouseUp)
}

function onResetMeme() {
    const draws = getDraws()
    for (const draw of draws) {
        draw.element.remove()
    }
    document.querySelector('.settings-container').reset()
    gCount = 0
    resetMeme()
}

function onSelectImage(imgId) {
    createMeme(gImages[imgId])
    document.querySelector('.main-gallery').classList.add('hide')
    document.querySelector('.editor').classList.remove('hide')
    window.addEventListener('resize', onResize)
    window.addEventListener('mouseup', onMouseUp)
    onResize()
}

function createImageHTML(id) {
    return `<li class="image-container hide"
            id="image${id}" onclick="onSelectImage(this.id)"></li>`
}

function loadLocalImg(path, element) {
    const img = new Image()
    img.src = path
    img.onload = () => {
        element.style['background-image'] = `url(${path})`
        onImageReady(img, element)
    }
}

function onImageReady(img, element) {
    element.classList.remove('hide')
    gImages[element.id] = img
}

function rgbToHex(strRGB) {
    let rbgNums = strRGB.replace('rgb(', '').replace(')', '').replace(',', '').split(' ')
    return `#${numToHex(parseInt(rbgNums[0]))}${numToHex(parseInt(rbgNums[1]))}${numToHex(parseInt(rbgNums[2]))}`
}

function numToHex(num) {
    const hex = num.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}

function isInRange(min, max, num) {
    return num >= min && num <= max
}

function _getCurrentDraw() {
    const currId = getCurrContainer().id
    return document.getElementById(`canvas-text${currId}`)
}

function _getDrawById(id) {
    return document.getElementById(`canvas-text${id}`)
}