var phone_num = "";
var email_add = "";


/////////////this is prog entry point:
function expo_backoff(){
  //this is going to be out entry point for the trigger
  //it will repeatedly try out calling our main function but it will use
  //an exponential backoff.  If we really, really can't reach google servers
  //then this should give up and send me an email saying that google is down-ish.
  Logger.log("-----------expo_backoff() running....");
  
  errors = [];
  var dont_retry = true;
  
  //this is the real part of the exponential backoff:
  for (var i = 0; i <=5; i++) {
    var wait = 0;
    if (i)  { // 2^0 = 1, so let's skip over i=0, so we're not waiting 1+random seconds each time we execute...
      wait = (Math.pow(2, i)*1000) + Math.floor((Math.random()*1000)+1);  //0,1,2,4,8,etc. + random 1 to 1000; 
    }

    Logger.log("going to sleep for " + wait + " milliseconds.");
    
    Utilities.sleep(wait); //never do this in regular JS, but in GS, izz kool.

    try{ fwdSMS(); }  //call our main function.       
    
    
    catch (e){
      errors[i] = e //add our error to the array
      Logger.log(e);
      dont_retry=false;
      }
    
    if (dont_retry) {break;} //ugly flag for breaking for loop on success
    
  } //end of for loop.

   if (errors.length) { //more than zero errors...
   GmailApp.sendEmail(email_add, "PAGER ERROR", 
                        "The Pager had run into a problem!!\n"+ 
                        "Just check out all this crap! \n"+ 
                        errors+
                        "Final wait was: "+ wait + " milliseconds\n"+
                        "Check the news and if Google is down, ESCAPE TO THE WOODS!\n");    
  }  

}


//here's where we deal with SMS and auto replies and whatever else:
function fwdSMS() {
  Logger.log("-----------fwdSMS() running....");
  
  //throw true; //test error for our expo backoff function
  
  //use the pre-defined 'send text' label to determin which emails
  //our function needs to action
  var label = GmailApp.getUserLabelByName('Send Text'); //!!!this can fail because sometimes Google servers are inaccessible.
                                                        //this is why expo backoff needed

  var reply_label = GmailApp.getUserLabelByName('DummyReplyLabel');  //this is just for testing purposes   
  var threads = label.getThreads();
  
  var today = new Date(); //today
  var now = today.getTime();  //now
  
  var d630 = new Date(today.getYear(), today.getMonth(), today.getDate(), 6, 00, 0, 0);  //biz open
  var d430 = new Date(today.getYear(), today.getMonth(), today.getDate(), 16, 30, 0, 0); //biz close
  
  function logStuff(somethingToLog) { //this is a closure for logging things along the way. 
    //I guess i could have made it a sep function. meh.
    //Actually, makes more sense as a closure, because it deals with shit that expo_backoff above 
    //doesn't need to worry about.
  
    
    if(typeof(somethingToLog)==='undefined') {
      somethingToLog = "nothing to report";
      Logger.log(somethingToLog);
    }
    
    else
    {
      Logger.log(somethingToLog);
      Logger.log(now);
      Logger.log(d630.getTime());
      Logger.log(d430.getTime());
    
      Logger.log(d630);
      Logger.log(d430);
      Logger.log(today);
      Logger.log(today.getDay());
      Logger.log("__________");
    }
  }
  
  
  try{
    //are we open?
    if ((now >= d630.getTime()) && (now <= d430.getTime())) {
    
      logStuff("yesssss, we are open for biz");
    
      for (i in threads) {
        var eachthread = threads[i].getMessages()[0];  //get the firstmessage
        var eachthread.forward(phone_num) //and fwd it to our contact #
      }
    
    label.removeFromThreads(threads);  //remove the "send text" label so we don't keep running over this every iteration
    
  }
  
  else //we are closed, so send a canned response to the client.
  {
    logStuff("nooooooooooo, we are clooooosed");
    
    for(i in threads) {
      
      reply_label.addToThread(threads[i]);  //this is just a testing mechanism, to make sure this thing don't screw up and send multiple things.
                                            //basically just add the "reply" label

      GmailApp.sendEmail(email_add, "FAKE NOTIFICATION", "If I had been live, I would've sent this reply.");
      
      
      butts2 = threads[i].getMessages()[0];  //get the first message of each thread
      //butts2.reply("No way, Jose!!! We are CLOSED");    //...and reply to it.
    
    }

    //either way, we still don't want to keep replying...
    label.removeFromThreads(threads);  
    }
    
  
  }
  
  catch(err){
    Logger.log(err);
    GmailApp.sendEmail(email_add, "PAGER ERROR", "The Pager had run into a problem!!\n"+err);
    
  }
  

}

