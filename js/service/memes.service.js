'use strict'

let gMeme = null

function createMeme(settings) {
    gMeme = {
        image: settings.image,
        settings,
        draws: []
    }
    return gMeme
}

function getMeme() {
    return gMeme
}

function updateSettings(settings) {
    gMeme.settings = settings
}

function addDraw(pos, draw = gMeme.settings) {
    draw.x = pos.x
    draw.y = pos.y
    gMeme.draws.unshift(draw)
}