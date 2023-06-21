'use strict'

let gCanvas
let gCtx
let gSettings

const gPos = {
    x: 0,
    y: 0
}

const drawMap = {
    caption: onAddCaption,
}

function onInit() {
    gCanvas = document.querySelector('#canvas')
    gCtx = gCanvas.getContext('2d')
    window.addEventListener('resize', onResize)
    onSetSettings()
    onmousemove = onMouseMove
    loadLocalImg(gSettings.imgURL)
    onResize()
}

function renderMeme() {
    const meme = getMeme()
    if (!meme) return
    drawMeme(meme)
    for (const drawing of meme.draws) {
        drawing.draw(drawing)
    }
}

function drawMeme(meme) {
    drawImage(meme.image, gCanvas.width / 2, gCanvas.height / 2)
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
    gSettings.draw = drawCaption
    updateSettings(gSettings)
    addDraw({x: 100, y: 100})
}

function drawCaption(capt) {
    gCtx.lineWidth = 2
    gCtx.strokeStyle = capt.stroke
    gCtx.fillStyle = capt.fill
    gCtx.font = `${capt.fontSize}px ${capt.font}`
    gCtx.textAlign = 'center'
    gCtx.textBaseline = 'middle'
    gCtx.fillText(capt.caption, capt.x, capt.y)
    gCtx.strokeText(capt.caption, capt.x, capt.y)
}

function onMouseMove(ev) {
    gPos.x = ev.x
    gPos.y = ev.y
}

function onSetSettings(key) {
    if (!key) {
        gSettings = {
            caption: 'MEME GENERATOR',
            font: 'Arial',
            fontSize: '16',
            fill: 'black',
            stroke: 'black',
            imgURL: 'images/intrusive.jpg',
            draw: drawCaption
        }
    }
}

function onResize() {
    gCanvas.width = 0.6 * window.innerWidth
    gCanvas.height = 0.6 * window.innerHeight
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
    gSettings.image = img
    createMeme(gSettings)
    renderMeme()
    onAddDraw('caption')
}