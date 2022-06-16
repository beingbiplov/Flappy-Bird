let toPx = (n) => {
    return `${n}px`
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}

let gameSectionDiv = document.getElementById('game_section')
let gameDiv = document.getElementById('game')
const mainMenu = document.getElementById('main_menu')
const start = document.getElementById('start')
const restart = document.getElementById('restart_btn')
const finalScoreDiv = document.getElementById('final_score')

const gameScreenHeight = 500
const baseHeight = 80
const activeGameWindow = gameScreenHeight - baseHeight

const birdImages = ['bluebird-downflap.png', 'bluebird-midflap.png', 'bluebird-upflap.png', 'bluebird-midflap.png']

class Game {
    constructor(gameSectionDiv, gameScreenHeight){
        this.gameSectionDiv = gameSectionDiv
        this.gameScreenHeight = gameScreenHeight
        this.gameSpeed = 1000
        this.score = 0
        let hScore = localStorage.getItem('highscore');
        if(null == hScore)
        {
            hScore = 0;
        }
        this.highscore = hScore

        this.birdDiv
        this.birdImg

        this.birdPosY = 200
        this.birdPosX = 80
        this.birdImgIdx = 1
        this.birdHeight = 20
        this.birdWidth = 20
        this.birdDownCount = 0
        this.birdAlive = true
        this.birdFlyHeight = 50
        this.gravity = 1
        this.acceleration = 0.2

        this.poles = []
        this.upPoleHeight
        this.downPoleHeight
        this.poleWidth = 55
        this.obstacleSpeed = 1000
        this.obstaclePosX = 0
        this.poleIds =[]
        this.scoreDiv

        this.moveBirdDownInterval
        this.animateBirdInterval
        this.moveObstaclesInerval
        this.createObstaclesInterval
        this.removePoleInterval
        this.detectCollisionInterval
        this.updateScoreInterval

        this.drawBird()
        this.moveBirdDown()
        this.animateBird()
        this.birdControls()
        this.generateObstacles()
        this.createObstacles()
        this.removePole()
        this.detectCollision()
        this.updateScoreOnScreen()
        this.moveObstacles()
    }

    drawBird(){

        this.birdDiv = document.createElement('div')
        this.birdDiv.style.position = 'absolute'
        this.birdDiv.style.left = toPx(this.birdPosX)
        this.birdDiv.style.height = toPx(this.birdHeight)
        this.birdDiv.style.width = toPx(this.birdWidth)
        this.birdDiv.style.top = toPx(this.birdPosY)
        this.birdDiv.style.zIndex = '2'

        this.gameSectionDiv.appendChild(this.birdDiv)
        
        this.birdImg = document.createElement('img')
        this.birdImg.src = `./assets/images/${birdImages[this.birdImgIdx]}`
        this.birdImgIdx += 1

        this.birdDiv.appendChild(this.birdImg)

    }

    animateBird(){

        this.animateBirdInterval = setInterval(() => {
            this.birdImg.src = `./assets/images/${birdImages[this.birdImgIdx]}`
            if (this.birdImgIdx >= 2){
                this.birdImgIdx = 0
            }
            else{
                this.birdImgIdx += 1
            }
        }, 10000/60)
        
        
    }

    moveBirdDown(){
        this.moveBirdDownInterval = setInterval(() => {
            
            if (this.birdPosY <= (activeGameWindow - this.birdHeight) && this.birdPosY >= 0) {
                this.birdDiv.style.top = toPx(this.birdPosY)
                if(this.birdAlive){
                    this.birdPosY += 1
                    this.birdDownCount +=1
                    this.manageBirdAngle()
                }
                else{
                    this.birdPosY += 5
                    this.birdDownCount = 60
                    this.manageBirdAngle()
                }
                
            }
            else if(this.birdPosY >= (activeGameWindow - this.birdHeight)){
                
                this.manageBirdAngle()
                if (this.birdAlive){
                    this.handleCollision()
                    this.birdAlive = false
                }
                
            }
            
        }, 1000/60)
    }

    moveBirdUp() {
        if (this.birdAlive){
            if (this.birdPosY <= (activeGameWindow - this.birdHeight) && this.birdPosY >= this.birdFlyHeight) {
                this.birdPosY -= this.birdFlyHeight
                this.birdDiv.style.top = toPx(this.birdPosY)
                this.birdDownCount = -20
                this.manageBirdAngle()

        
                // setTimeout(()=>{this.moveBirdDown()}, 200)
            }
        }
        
    }

    birdControls() {

        document.addEventListener("keydown", function (evt) {
            if (evt.keyCode === 32  || evt.key === "ArrowUp") {
                this.moveBirdUp()

            }}.bind(this));
    }

    manageBirdAngle(){
        // console.log(this.birdDownCount)
        if (this.birdAlive){
            if (this.birdDownCount >= 60){
                this.birdDiv.style.transform = `rotateZ(60deg)`
            }
            else if (this.birdDownCount >= 30){
                this.birdDiv.style.transform = `rotateZ(${this.birdDownCount}deg)`
            }
            else if (this.birdDownCount >= 0){
                this.birdDiv.style.transform = `rotateZ(0deg)`
            }
            else if (this.birdDownCount <= -20){
                this.birdDiv.style.transform = "rotateZ(-40deg)"
            }
        }
        else {
            this.birdDiv.style.transform = "rotateZ(60deg)"
        }
    }

    createObstacles(){
        this.createObstaclesInterval = setInterval(() => {

            let prevPole = this.poles[this.poles.length-1]
            if (this.poles.length % 3 == 0){
                if (parseInt(prevPole.style.right) > 280){
                    this.generateObstacles()
                }
            }
            else if (parseInt(prevPole.style.right) > 180){
                this.generateObstacles()
            }
            
        }, this.gameSpeed)
    }

    generateObstacles(){
        this.generatePoleDimensions() // generationg new pole heights

        const upPole = document.createElement('div')
        upPole.style.height = toPx(this.upPoleHeight)
        upPole.style.width = toPx(this.poleWidth)
        upPole.style.position = 'absolute'
        upPole.style.top = '0'
        upPole.style.right = toPx(this.obstaclePosX)
        upPole.style.transform = "rotate(180deg)"
        upPole.setAttribute("class", "pole")
        
        let id1 = `pole${this.poleIds.length}`
        upPole.id = id1
        this.poleIds.push(id1)

        this.gameSectionDiv.appendChild(upPole)

        let upPoleImg = document.createElement('img')
        upPoleImg.src = './assets/images/pipe-green.png'
        upPoleImg.style.height = '100%'
        upPoleImg.style.width = '100%'

        upPole.appendChild(upPoleImg)
        this.poles.push(upPole)

        const downpole = document.createElement('div')
        downpole.style.height = toPx(this.downPoleHeight)
        downpole.style.width = toPx(this.poleWidth)
        downpole.style.position = 'absolute'
        downpole.style.bottom = `${baseHeight}px`
        downpole.style.right = toPx(this.obstaclePosX)
        downpole.setAttribute("class", "pole")

        this.gameSectionDiv.appendChild(downpole)

        let downPoleImg = document.createElement('img')
        downPoleImg.src = './assets/images/pipe-green.png'
        downPoleImg.style.height = '100%'
        downPoleImg.style.width = '100%'

        downpole.appendChild(downPoleImg)

        this.poles.push(downpole)

        let id2 = `pole${this.poleIds.length}`
        downpole.id = id2
        this.poleIds.push(id2)

    }
    
    generatePoleDimensions() {
        this.upPoleHeight = getRandomInt(50, 250)
        let poleGap = getRandomInt((this.birdHeight+ this.birdFlyHeight)*1.5, 1.8*(this.birdHeight+ this.birdFlyHeight))
        this.downPoleHeight = (activeGameWindow) - (this.upPoleHeight + poleGap)
    }

    moveObstacles() {
        this.moveObstaclesInerval = setInterval(() =>{
            for (let pole of this.poles){
                let newPos = parseInt(pole.style.right) + 1
                pole.style.right = toPx(newPos)
                // this.obstaclePosX += 1

            }

            
                
        }, 1000/60)
    }

    removePole(){
        this.removePoleInterval = setInterval((() => {
            this.poles.forEach((pole, i) =>{
                if (parseInt(pole.style.right) > this.gameSectionDiv.offsetWidth){
                    this.poles.splice(i,2)
                    pole.remove()

                    this.updateScore()
                    
                }
                
            })

        }), this.gameSpeed/60)
    }


    detectCollision(){
        
        this.detectCollisionInterval = setInterval(() => {
            const dim1 = this.birdDiv.getBoundingClientRect()
            for (let i=0; i<this.poles.length; i++){
                let dim2 = this.poles[i].getBoundingClientRect()
                if (
                    (dim1.x < dim2.x + dim2.width &&
                    dim1.x + dim1.width > dim2.x &&
                    dim1.y < dim2.y + dim2.height &&
                    dim1.height + dim1.y > dim2.y)
                ){
                    this.handleCollision()
                }
            }
        }, this.gameSpeed/60)
        
    }

    updateScore(){
        
        this.score += 1
        console.log(this.score)
        if (this.score < 10){
            this.scoreDiv.src = `./assets/images/${this.score}.png`
            this.scoreDiv.zIndex = 1
            this.scoreDiv.setAttribute('class', 'scoresec')

        }
        else{
            let strScore = this.score.toString()
            this.scoreDiv.src = `./assets/images/${strScore[0]}.png`
            let left = 47
            for(let i=1; i<strScore.length; i++){
                console.log(i, strScore[i])
                this.scoreDiv = document.createElement('img')
                this.scoreDiv.style.position = 'absolute'
                this.scoreDiv.src = `./assets/images/${strScore[i]}.png`
                this.scoreDiv.zIndex = 1
                this.scoreDiv.style.left = `${left}%`
                this.scoreDiv.style.top = '2%'
                this.scoreDiv.setAttribute('class', 'scoresec')

                this.gameSectionDiv.appendChild(this.scoreDiv)
        }
    }
        
    }

    updateScoreOnScreen(){
        this.scoreDiv = document.createElement('img')
        this.scoreDiv.style.position = 'absolute'
        this.scoreDiv.src = `./assets/images/${this.score}.png`
        this.scoreDiv.zIndex = 1
        this.scoreDiv.style.left = '45%'
        this.scoreDiv.style.top = '2%'
        this.scoreDiv.setAttribute('class', 'scoresec')

        this.gameSectionDiv.appendChild(this.scoreDiv)
  
    }

    finalScoreBoard() {
        let fScore = document.getElementById('final_score')
        fScore.style.zIndex = 1
        let board = document.getElementById('board')
        fScore.style.display = 'block'

        let hScoreDiv = document.createElement('div')
        hScoreDiv.position = 'absolute'

        board.appendChild(hScoreDiv)

        let medal = document.createElement('img')
        if (this.score>=this.highscore){
            medal.src = './assets/images/gold.png'
        }
        else{
            medal.src = './assets/images/bronze.png'
        }
        medal.style.position = 'absolute'
        medal.style.top = '37%'
        medal.style.left = '24px'
        medal.style.width = '43px'
        medal.style.height = '43px'
        board.appendChild(medal)

        let strhScore = this.highscore.toString()
        let left = 170
        for(let i=0; i<strhScore.length; i++){
            let hscoreImg = document.createElement('img')
            hscoreImg.style.position = 'absolute'
            hscoreImg.src = `./assets/images/${strhScore[i]}.png`
            hscoreImg.zIndex = 2
            hscoreImg.style.left = `${left}px`
            left += 15
            hscoreImg.style.top = '65%'
            hscoreImg.style.width='12px'
            hscoreImg.style.height='18px'

            hScoreDiv.appendChild(hscoreImg)
        }

        let uScoreDiv = document.createElement('div')
        uScoreDiv.position = 'absolute'

        board.appendChild(uScoreDiv)

        let struScore = this.score.toString()
        let uleft = 170
        for(let i=0; i<struScore.length; i++){
            let uScoreImg = document.createElement('img')
            uScoreImg.style.position = 'absolute'
            uScoreImg.src = `./assets/images/${struScore[i]}.png`
            uScoreImg.zIndex = 2
            uScoreImg.style.left = `${uleft}px`
            uleft += 15
            uScoreImg.style.top = '28%'
            uScoreImg.style.width='12px'
            uScoreImg.style.height='18px'

            uScoreDiv.appendChild(uScoreImg)
        }

        
    }

    removeAllPole(){

        // for(let i = 0; i< this.poles.length)
            this.poles.forEach((pole, i) =>{
                console.log(pole.id)
                pole.remove()  
            })
            this.poles = []

    }

    handleCollision(){
        if (this.score > this.highscore){
            this.highscore = this.score
            localStorage.highscore = this.highscore
        }

        this.birdAlive = false
        this.scoreDiv.style.left = '40%'
        this.scoreDiv.src = `./assets/images/gameover.png`
        this.scoreDiv.style.zIndex = '1'
        this.scoreDiv.setAttribute('class', 'scoresec')

        let baseDiv = document.getElementById('base')
        baseDiv.style.animation = 'none'
        this.finalScoreBoard()
        this.removeAllPole()
        clearInterval(this.animateBirdInterval)
        clearInterval(this.moveObstaclesInerval)
        clearInterval(this.createObstaclesInterval)
        clearInterval(this.removePoleInterval)
        clearInterval(this.detectCollisionInterval)
        clearInterval(this.moveBirdDownInterval)
        clearInterval(this.updateScoreInterval)
        document.getElementById('restart').style.display = 'block'
        this.birdDiv.innerHTML = ''
    }

}


start.addEventListener('click', () => {
    mainMenu.style.display = 'none'
    gameDiv.style.display = 'block'
    const game1 = new Game(gameSectionDiv, gameScreenHeight)


})

restart.addEventListener('click', () => {
    let baseDiv = document.getElementById('base')
    let scores = document.getElementsByClassName('scoresec')
    for (let score of scores){
        score.remove()
    }
    baseDiv.style.animation = 'move 2s infinite linear'
    finalScoreDiv.style.display= 'none'
    mainMenu.style.display = 'none'
    gameDiv.style.display = 'block'
    document.getElementById('restart').style.display = 'none'
    const game1 = new Game(gameSectionDiv, gameScreenHeight)


})

// game1 = new Game(gameSectionDiv, gameScreenHeight)