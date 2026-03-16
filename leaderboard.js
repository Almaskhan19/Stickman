function saveScoreToLeaderboard(name,score){

    let list = JSON.parse(localStorage.getItem("leaderboard")) || []
    
    list.push({name:name,score:score})
    
    list.sort((a,b)=>b.score-a.score)
    
    localStorage.setItem("leaderboard",JSON.stringify(list))
    
    renderLeaderboard()
    
    }
    
    function renderLeaderboard(){
    
    let list = JSON.parse(localStorage.getItem("leaderboard")) || []
    
    const ul = document.getElementById("leaderboardList")
    
    ul.innerHTML=""
    
    list.slice(0,3).forEach((player)=>{
    
    let li = document.createElement("li")
    li.textContent = player.name + " — " + player.score
    
    ul.appendChild(li)
    
    })
    
    }
    