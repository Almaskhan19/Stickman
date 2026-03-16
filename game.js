const canvas = document.getElementById("gameCanvas")
const ctx = canvas.getContext("2d")

canvas.width = 420
canvas.height = 640

let score=0
let coins=0

let heroX=80
let heroY=380

const heroFootOffset = 20 // in drawHero feet are at heroY + 20
const HERO_STAND_INSET = 12
const baseBottomY = 640
const MIN_PILLAR_H = 140
const MAX_PILLAR_H = 320

let stickLength=0
let stickAngle=-90
let stickTargetAngle = 0

let phase="waiting"

let walkCycle=0

let pillars=[]
let coinObjects=[]

function makePillar(x,w){
const h = MIN_PILLAR_H + Math.random() * (MAX_PILLAR_H - MIN_PILLAR_H)
const topY = baseBottomY - h
return {x,w,h,topY}
}

function getPivot(){
return { x: pillars[0].x + pillars[0].w, y: pillars[0].topY }
}

function updateHeroYOnStick(){
const pivot = getPivot()
const theta = stickAngle * Math.PI/180
const yFoot = pivot.y + Math.tan(theta) * (heroX - pivot.x)
heroY = yFoot - heroFootOffset
}

let profile = loadProfile()

document.getElementById("playerName").innerText = profile.name
document.getElementById("bestScore").innerText = profile.highScore

const bgMusic=document.getElementById("bgMusic")

const namePromptEl = document.getElementById("namePrompt")
const nameInputEl = document.getElementById("nameInput")
const saveNameBtnEl = document.getElementById("saveNameBtn")

function normalizePlayerName(raw){
const name = (raw || "").trim().slice(0,16)
return name.length ? name : ""
}

function openNamePrompt(){
namePromptEl.classList.remove("hidden")
nameInputEl.value = profile.name ? profile.name : ""
setTimeout(()=>nameInputEl.focus(), 0)
}

function closeNamePrompt(){
namePromptEl.classList.add("hidden")
}

function ensurePlayerNameThenStart(){
// Always require name entry each new game start (pre-filled).
document.getElementById("gameOver").classList.add("hidden")
openNamePrompt()
}

saveNameBtnEl.addEventListener("click", ()=>{
const name = normalizePlayerName(nameInputEl.value)
if(!name) return
profile.name = name
saveProfile(profile)
document.getElementById("playerName").innerText = profile.name
closeNamePrompt()
startGame()
})

nameInputEl.addEventListener("keydown", (e)=>{
if(e.key === "Enter"){
saveNameBtnEl.click()
}
})

const STICK_GROW_SPEED = 4.5
const STICK_FALL_SPEED = 6
const HERO_WALK_SPEED = 3
const CAMERA_SHIFT_SPEED = 8

let isPointerDown = false
let cameraShiftRemaining = 0
let pendingEndGame = false
let landingOk = false
let landingChecked = false
let walkToEdgeTargetX = 0

function clamp(n,min,max){ return Math.max(min,Math.min(max,n)) }

function startGame(){

score=0
coins=0

heroY=380
phase="waiting"
stickLength=0
stickAngle=-90
stickTargetAngle = 0
walkCycle=0
coinObjects=[]
pendingEndGame=false
landingOk=false
landingChecked=false

generateStartPillars()

heroX = pillars[0].x + pillars[0].w - HERO_STAND_INSET
heroY = pillars[0].topY - heroFootOffset

document.getElementById("gameOver").classList.add("hidden")
document.getElementById("coinCount").innerText=coins
document.getElementById("score").innerText=score
document.getElementById("bestScore").innerText=profile.highScore

bgMusic.play().catch(()=>{})

}

function generateStartPillars(){

pillars=[
makePillar(0,80),
makePillar(220,60)
]

spawnCoin()

}

function spawnCoin(){

let p=pillars[1]

if(!p) return

coinObjects.push({
x:p.x+p.w/2,
y:p.topY-20,
collected:false
})

}

function generateNextPillar(){

let gap=150+Math.random()*120
let width=40+Math.random()*60

let last=pillars[pillars.length-1]

pillars.push(makePillar(last.x+last.w+gap,width))

spawnCoin()

}

function update(){

if(phase==="growing"){

stickLength = clamp(stickLength + STICK_GROW_SPEED, 0, canvas.width*2)

}

if(phase==="fallingStick"){

stickAngle += STICK_FALL_SPEED

if(stickAngle>=stickTargetAngle){
stickAngle=stickTargetAngle
phase="walking"
landingChecked=false
}

}

if(phase==="walking"){

heroX+=HERO_WALK_SPEED
walkCycle+=0.2
updateHeroYOnStick()

const next=pillars[1]
if(next){
const pivot = getPivot()
const theta = stickAngle * Math.PI/180
const stickEndX = pivot.x + stickLength*Math.cos(theta)

if(heroX >= stickEndX){
if(!landingChecked){
const stickEndY = pivot.y + stickLength*Math.sin(theta)
landingOk = stickEndX >= next.x && stickEndX <= (next.x + next.w) && Math.abs(stickEndY - next.topY) < 4
pendingEndGame = !landingOk
landingChecked=true
}

if(pendingEndGame){
phase="falling"
}else{
phase="walkingToEdge"
walkToEdgeTargetX = next.x + next.w - HERO_STAND_INSET
}
}
}

}

if(phase==="walkingToEdge"){

heroX+=HERO_WALK_SPEED
walkCycle+=0.2
updateHeroYOnStick()

if(heroX >= walkToEdgeTargetX){
heroX = walkToEdgeTargetX
phase="shifting"
cameraShiftRemaining = pillars[1].x
}

}

if(phase==="shifting"){

const dx = Math.min(CAMERA_SHIFT_SPEED, cameraShiftRemaining)
pillars.forEach(p=>{ p.x -= dx })
coinObjects.forEach(c=>{ c.x -= dx })
heroX -= dx
cameraShiftRemaining -= dx

if(cameraShiftRemaining <= 0.01){
pillars.shift()
coinObjects = coinObjects.filter(c => !c.collected)
while(pillars.length < 2) generateNextPillar()

heroX=pillars[0].x+pillars[0].w - HERO_STAND_INSET
heroY=pillars[0].topY-heroFootOffset
stickLength=0
stickAngle=-90
stickTargetAngle=0
pendingEndGame=false
landingOk=false
landingChecked=false
score++
phase="waiting"
}

}

if(phase==="falling"){
heroY += 8
if(heroY > canvas.height + 60){
endGame()
phase="gameover"
}

}

coinObjects.forEach(c=>{

if(!c.collected && Math.abs(heroX-c.x)<10 && Math.abs((heroY-20)-c.y)<40){

c.collected=true
coins++
document.getElementById("coinCount").innerText=coins

}

})

}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height)

drawParallax()

drawPillars()

drawCoins()

drawStick()

drawHero()

document.getElementById("score").innerText=score

}

function drawHero(){

ctx.strokeStyle="white"
ctx.lineWidth=3

let leg=Math.sin(walkCycle)*6
let arm=Math.sin(walkCycle+Math.PI)*6

ctx.beginPath()

ctx.arc(heroX,heroY-15,6,0,Math.PI*2)

ctx.moveTo(heroX,heroY-10)
ctx.lineTo(heroX,heroY+10)

ctx.moveTo(heroX,heroY-5)
ctx.lineTo(heroX-10+arm,heroY+5)

ctx.moveTo(heroX,heroY-5)
ctx.lineTo(heroX+10-arm,heroY+5)

ctx.moveTo(heroX,heroY+10)
ctx.lineTo(heroX-10+leg,heroY+20)

ctx.moveTo(heroX,heroY+10)
ctx.lineTo(heroX+10-leg,heroY+20)

ctx.stroke()

}

function drawStick(){

if(stickLength<=0) return

ctx.save()

ctx.translate(pillars[0].x+pillars[0].w,pillars[0].topY)

ctx.rotate(stickAngle*Math.PI/180)

ctx.fillStyle="yellow"

ctx.fillRect(0,-3,stickLength,3)

ctx.restore()

}

function drawPillars(){

ctx.fillStyle="#3d4260"

pillars.forEach(p=>{
ctx.fillRect(p.x,p.topY,p.w,canvas.height-p.topY)
})

}

function drawCoins(){

coinObjects.forEach(c=>{

if(!c.collected){

ctx.fillStyle="gold"
ctx.beginPath()
ctx.arc(c.x,c.y,6,0,Math.PI*2)
ctx.fill()

}

})

}

function drawParallax(){

ctx.fillStyle="#2f3555"

ctx.beginPath()
ctx.arc(150,520,200,Math.PI,0)
ctx.fill()

ctx.beginPath()
ctx.arc(350,520,200,Math.PI,0)
ctx.fill()

}

function endGame(){

profile.gamesPlayed++

if(score>profile.highScore){

profile.highScore=score

}

profile.coins+=coins

saveProfile(profile)

saveScoreToLeaderboard(profile.name,score)

document.getElementById("finalScore").innerText=score
document.getElementById("bestScore").innerText=profile.highScore

document.getElementById("gameOver").classList.remove("hidden")

}

function loop(){

update()
draw()

requestAnimationFrame(loop)

}

renderLeaderboard()
ensurePlayerNameThenStart()
loop()

function pointerDown(){
if(phase!=="waiting") return
isPointerDown=true
phase="growing"
}

function pointerUp(){
if(!isPointerDown) return
isPointerDown=false
if(phase==="growing"){
const next = pillars[1]
const pivotY = pillars[0].topY
const dy = next ? (next.topY - pivotY) : 0
const s = clamp(dy / Math.max(stickLength, 1), -1, 1)
stickTargetAngle = Math.asin(s) * 180/Math.PI
phase="fallingStick"
}
}

canvas.addEventListener("mousedown", pointerDown)
window.addEventListener("mouseup", pointerUp)
canvas.addEventListener("touchstart", (e)=>{ e.preventDefault(); pointerDown() }, {passive:false})
window.addEventListener("touchend", (e)=>{ e.preventDefault(); pointerUp() }, {passive:false})
