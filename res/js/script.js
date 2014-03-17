console.log("Initializing the script for the chat page...");

// trebuie sa salvam cumva numele utilizatorului din adf... un serviciu care sa intoarca asta
var sessionScope = {appContextRoot:"", localTesting:true, serverTesting:false, currentPageId:"", name:""};
var users = {};
var usersNumber = "";
var messages = {};
var number = 1;

function setUsername() {
    //get the username from the context and set it in the sessionScope variable name
}

function loadTemplate( name, filename, path ) {
    console.log("loadTemplate");
    console.log("template name " + name);
    console.log("filename " + filename);
    console.log("path " + path);
    $.ajax({
        url:(path || "res/templates/") + filename,
        dataType:'text',
        async:false,
        success:function( template ) {
            console.log('Compiling template: ' + name + ' = ' + template);
            dust.loadSource( dust.compile( template, name ));
        },
        error:function( xhr, ajaxOptions, thrownError ) {
            console.log("Error in load template");
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}

function invokeService(auth, serviceName, offlineServiceJSON, parameters, successHandler, errorHandler) {
    console.log("invokeService");
    console.log("serviceName " + serviceName);
    console.log("offlineServiceJSON " + offlineServiceJSON);
    console.log(parameters);

    var handler = function ( isOk, err, response ) {
        console.log( response );

        if ( !isOk ) {
            if ( errorHandler )
                errorHandler( err );
            else {
                //TODO: show error
                console.log('ERROR OCCURRED:');
                console.log("ERROR OCCURRED CALLING " + serviceName + ": " + err);
            }
            return;
        }
        if ( successHandler ){
            successHandler( response );
        }
        else{
            window.history.back();
        }
    }

    if ( sessionScope.localTesting || !serviceName ) {
        console.log("sessionScope.localTesting " + sessionScope.localTesting);
        console.log("No service name. Acquiring dummy data...");
        if ( offlineServiceJSON ) {
            console.log( "OfflineserviceJSON " + offlineServiceJSON );
            //async
            var data;
            $.getJSON( offlineServiceJSON, function ( data ) {
                console.log( "data " + data );
                handler( true, null, data.response );
            });
        }
        else if ( successHandler )
            successHandler();
        else
            window.history.back();
    } else {
        ( auth ? dvh_utils.runMethodAuth : dvh_utils.runMethodNoAuth ) ( serviceName,
            parameters,
            handler
        );
    }
}

function refreshContainer( container, force ) {
    if ( container.is( "ul" ))
        container.listview( "refresh" );
    else
        container.trigger( "create" );
}

function initChatUsers() {
    console.log( "Initialize chat users..." );

    var page = $( "#page_main_chat" );

    loadTemplate( "userList", "user_list.dust.html" );
    loadTemplate( "userNumber", "user_number.dust.html" );
 var response;
    invokeService( true, "dvhchat_getUsers", "res/mockups/getUsers.json", {}, (function ( response ) {
        var container = page.find( ".roster-pane" );
        container.empty();
        usersNumber = response.users_number;

        for (var i = 0; i < response.users_number; i++) {
            var user = {};
            user.id = response.users[i].id;
            user.name = response.users[i].name;
            user.label = response.users[i].label;
            users[i] = user;
        }

        for (var i = 0; i < response.users_number; i++) {
            console.log(users[i]);
        }

        localStorage.setItem( "users", users );

        dust.render( "userList", response, function ( err, out ) {
            container.append( out );
        });

        var container1 = page.find( "#chat-toolbar" );
        container1.empty();

        dust.render( "userNumber", response, function ( err, out ) {
            container1.append( out );
        });

    }));
}

var hasStorage = ( function() {
    try {
        localStorage.setItem( "mod", "mod" );
        localStorage.removeItem( "mod" );
        return true;
    } catch( e ) {
        return false;
    }
}());

function refreshWindow() {
    if ( !hasStorage ) {
        console.log( "LocalStorage not supported! Change your browser!" );
        return false;
    }

//    alert("refreshWindow");
    console.log( localStorage.getItem("users") );
}

//pentru chestia asta ne trebuie un fel de while forever in care sa fetch-uim mesajele de la utilizatori pe care le trimite
//serverul sau nu stiu altceva asemanator
function getUserMessageFromServer() {
    console.log( "Getting user's messages..." );

    var page = $( "#page_main_chat" );
    loadTemplate( "userMessage", "user_message.dust.html" );

    console.log( "Trece de load template" );

    invokeService( true, "dvhchat_getUserMessages", "res/mockups/getUserMessages.json", {}, (function (response) {
        var container = page.find( ".message-pane" );

        // adaugam fiecare mesaj primit intr-un vector de mesaje in ordinea in care acestea vin de la server
        // apoi le vom adauga intr-o variabila local storage ce va fi folosita la refresh
        var mes = {};
        mes.name = response.name;
        mes.hour = response.hour;
        mes.message = response.message;

        console.log( "meeeeeeeeeeeeeeeeeeeeeeeeees" );
        console.log( mes );

        messages[ messages.length ] = mes;

        dust.render( "userMessage", response, function ( err, out ) {
            container.append( out );
        });

        console.log("before refresh");
        console.log(container);
        container.listview("refresh");
    }));
}

function messageListener( data ) {
    alert("MESSAGE LISTENER");
    data = "userMsgResponse#D";
    if ( !data )
        return;
    var params = data.split( "#" );
    switch ( params[0] ) {
        case "userMsgResponse":
            if ( params[1] == "D" ) {
                getUserMessageFromServer();
                return;
            }
            break;
        default :
            break;
            ;
    }
};

function sendMessage( data ) {
    alert( "Send Message: "+ data );

    $.ajax({
        type: "POST",
        url: "",
//        cache: false,
        data: data,
        dataType:'text',
        async:false,
        success: function(){
            alert("SUCCESSURI MULTE IN SEND MESSAGE");
            messageListener( data );
        },
        error: function( xhr, ajaxOptions, thrownError ) {
            alert("NU E SUCCESSS IN SEND MESSAGE");
            console.log("Error in send message");
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
    // what else should get in here?!
}

$("#page_main_chat").on("pageinit", function () {
    console.log("init main chat page");
    initChatUsers();
}).on("pagebeforeshow", function () {
        console.log("on page before show!");
        $( "#page_main_chat" ).find(".message-form").submit(function(event) {
            event.preventDefault();
            var text = $( "#page_main_chat" ).find( "#user_message" ).val();
            $( "#page_main_chat" ).find( "#user_message" ).val("");
            console.log( "TEXTUL introdus " + text );
            sendMessage( text );
    });
});
