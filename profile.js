function loadProfile(){

    let profile = JSON.parse(localStorage.getItem("stickmanProfile"))
    
    if(!profile){
    
    profile={
    name:"Player",
    highScore:0,
    coins:0,
    gamesPlayed:0
    }
    
    localStorage.setItem("stickmanProfile",JSON.stringify(profile))
    
    }
    
    return profile
    }
    
    function saveProfile(profile){
    localStorage.setItem("stickmanProfile",JSON.stringify(profile))
    }
    