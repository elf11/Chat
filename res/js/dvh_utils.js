var dvh_utils = {
    userName:       "",

    FIRST_PAGE_AFTER_LOGIN: "/pages/overview/overview.html",

    // URL-ul de baza al aplicatiilor Jersey
    //SERVER_URL:"http://192.168.50.79/",
    SERVER_URL:"http://82.78.234.52/",
    AUTH_APP_CONTEXT_ROOT:"ProjectMobiAuth/jersey/restappauth/",
    NO_AUTH_APP_CONTEXT_ROOT:"ProjectMobiNoAuth/jersey/restappnoauth/",
    LOGIN_URL: "ProjectMobiAuth/j_security_check",

    SESSION_EXPIRED_MSG:        "received_session_expired_or_not_logged_in",
    SHOW_INVALID_LOGIN_MSG: false,

    HTTP_ERRORS:{400:"", 401:"", 403:"", 404:"", 500:"", 1:"", 0:""},
    LANGUAGE:sessionScope.language,

    sendMessage:function (data) {
        // alert('Send Messge: '+data);
        //window.location = 'WebAppToMobileApp/'+data;
        //alert('redirected to ' + window.location.href );

        // we trigger the load of the src attribute of the iframe
        // and then we remove the iframe
        var iframe = document.createElement("IFRAME");
        iframe.setAttribute("src", 'WebAppToMobileApp/' + data);
        document.documentElement.appendChild(iframe);
        iframe.parentNode.removeChild(iframe);
        iframe = null;
    },

    // functia de pregatire a headerului de apel catre server in vederea autentificarii
    make_base_auth:function (user, pass) {
        var tok = user + ':' + pass;
        var hash = window.btoa(tok);
        return "Basic " + hash;
    },
    // functia principala de login
    login:function (username, password, fct) {
        //var urlRed = dvh_utils.composeUrlAuth("/hello/j_security_check", {});
        var urlRed = dvh_utils.SERVER_URL + dvh_utils.LOGIN_URL;

        //"http://192.168.50.79:8001/DVHRestAppAuthRestService/j_security_check";
        //alert('url: ' + urlRed);

        var request = $.ajax({
            type:"POST",
            dataType:"text",
            data:{j_username: username, j_password: password},
            url:urlRed,

            success: function(data, textStatus, xhr) {
                //alert('ok!');
                //alert(sessionScope.appContextRoot + dvh_utils.FIRST_PAGE_AFTER_LOGIN);
                //alert('context root: ' + sessionScope.appContextRoot);
                //console.log('before');
                $.mobile.changePage(sessionScope.appContextRoot + dvh_utils.FIRST_PAGE_AFTER_LOGIN);
                //console.log('after');
            },
            error: function(jqXHR, textStatus, errorThrown) {
                dvh_utils.SHOW_INVALID_LOGIN_MSG = true;
                invokeService(true, "hello", "", {}, function () {
                    dvh_utils.SHOW_INVALID_LOGIN_MSG = false;
                    $.mobile.changePage(sessionScope.appContextRoot + dvh_utils.FIRST_PAGE_AFTER_LOGIN);
                }, function () {
                });
                //if(jqXHR.status == "0") {
                //  $.mobile.changePage(sessionScope.appContextRoot + dvh_utils.FIRST_PAGE_AFTER_LOGIN);
                //return;
                //}
                //alert(textStatus + '; code is ' + jqXHR.status);
                //console.log('eroare: ' + errorThrown);
                //console.log('test status: ' + textStatus);
            }
        });
    },
    // functia de compunere al unui URL
    /*
     Exemplu apel:
     dvh_utils.composeUrlAuth('dvhmbcustinfo_getloans',{p1:"val1",p2:"val2"})
     */
    composeUrlAuth:function (base_url, parameters) {
        return dvh_utils.composeUrl(true, base_url, parameters);
    },
    composeUrlNoAuth:function (base_url, parameters) {
        return dvh_utils.composeUrl(false, base_url, parameters);
    },

    composeUrl:function (isAuth, base_url, parameters) {
        var url = dvh_utils.SERVER_URL;
        if (isAuth)
            url += dvh_utils.AUTH_APP_CONTEXT_ROOT;
        else
            url += dvh_utils.NO_AUTH_APP_CONTEXT_ROOT;
        url += base_url;// + '?callback=callback&timestamp=' + (new Date()).getTime();
        //url += "&language=" + dvh_utils.LANGUAGE + "&";
        //for (key in parameters) {
        //  url += key + "=" + parameters[key] + "&";
        //}
        //;
        return url;//.substring(0, url.length - 1);
    },

    composeParamsString:function (parameters) {
        var params = 'callback=callback&timestamp=' + (new Date()).getTime();
        var currLang = dvh_utils.LANGUAGE;
        if (dvh_utils.LANGUAGE != null && dvh_utils.LANGUAGE.length > 2) {
            currLang = dvh_utils.LANGUAGE.substring(0, 2);
        }

        params += "&language=" + currLang;
        params += "&view_id=" + sessionScope.currentPageId;
        for (key in parameters) {
            if (parameters[key] != null && parameters[key].length > 0)
                params += "&" + key + "=" + parameters[key];
        }
        return params;
    },

    runMethodAuth:function (contextRoot, parameters, returnFunction) {
        var url = dvh_utils.composeUrlAuth(contextRoot, parameters);
        dvh_utils.runMethod(url, parameters, returnFunction);
    },
    /*
     Exemplu apel:
     dvh_utils.runMethodNoAuth('fxrates', {a:"vala",b:"valb"},function(isOk, err, response){alert(isOk + ":" + err + ":" + response)});
     */
    runMethodNoAuth:function (contextRoot, parameters, returnFunction) {
        var url = dvh_utils.composeUrlNoAuth(contextRoot, parameters);
        dvh_utils.runMethod(url, parameters, returnFunction);
    },

    runMethod:function (url, parameters, returnFunction) {
        var request = $.ajax({
            type:"POST",
            dataType:"text",
            data:dvh_utils.composeParamsString(parameters),
            url:url
        });
        // alert('apelez ajaaax catre ' + url + ',param:' + parameters);
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // log the error to the console
            window.location.href = sessionScope.appContextRoot;

            dvh_utils.sendMessage('clearCookies');
            dvh_utils.sendMessage('setLoginBtnStatus#0');

            // alert('dvh_utils e pe fail: ' + jqXHR +'_' + textStatus + '_' + errorThrown);
            returnFunction(false, errorThrown, null);

        });
        request.done(function (httpObj, textStatus, obj) {
            if (obj != null && obj.status != null && obj.status == 200) {
                if(httpObj.indexOf(dvh_utils.SESSION_EXPIRED_MSG) != -1) {
                    //window.location.href = sessionScope.appContextRoot;
                    dvh_utils.sendMessage('clearCookies');
                    dvh_utils.sendMessage('setLoginBtnStatus#0');
                    if(dvh_utils.SHOW_INVALID_LOGIN_MSG == true) {
                        dvh_utils.SHOW_INVALID_LOGIN_MSG = false;
                        alert('Invalid Username or Password');
                    }
                    else if(sessionScope.currentPageId != "page_index")
                        alert('Your session has expired');
                    //alert(window.location.pathnamew);
                    $.mobile.changePage(sessionScope.appContextRoot +  "/login/login.html",
                        {   transition: "none", changeHash: false });
                    return;
                }

                var firstIndex = httpObj.indexOf("(");
                var lastIndex = httpObj.lastIndexOf(")");
                if (firstIndex != -1 && lastIndex != -1 && firstIndex + 1 < lastIndex) {
                    var rsp = jQuery.parseJSON(httpObj.substring(firstIndex + 1, lastIndex));
                    // rsp[0].timestamp
                    if (rsp[0].responseType == "D")
                        returnFunction(true, null, rsp[0].response);
                    else
                        returnFunction(false, rsp[0].responseType.substring(1), null);
                }
                else
                    returnFunction(false, dvh_utils.HTTP_ERRORS[1], null);
            }
            else {
                alert('Daca obtineti aceasta alerta instiintati-l pe ionut; statusul este: ' + obj.status);
                // unathorized => session timeout
                if (obj.status == 401) {
                    // alert('am 401!');
                    window.location.href = sessionScope.appContextRoot;
                    dvh_utils.sendMessage('clearCookies');
                    dvh_utils.sendMessage('setLoginBtnStatus#0');
                    alert('Your session has expired');
                }

                var err;
                if (dvh_utils.HTTP_ERRORS[obj.status] != null)
                    err = dvh_utils.HTTP_ERRORS[obj.status];
                else
                    err = dvh_utils.HTTP_ERRORS[1];
                returnFunction(false, err, null);
            }
        });
    },

    // functia de incarcare a mesajelor de eroare dintr-un bundle
    loadErrorMessages:function (bundleGetter) {
        dvh_utils.HTTP_ERRORS[400] = bundleGetter('ERR_400');
        dvh_utils.HTTP_ERRORS[401] = bundleGetter('ERR_401');
        dvh_utils.HTTP_ERRORS[403] = bundleGetter('ERR_403');
        dvh_utils.HTTP_ERRORS[404] = bundleGetter('ERR_404');
        dvh_utils.HTTP_ERRORS[500] = bundleGetter('ERR_500');
        dvh_utils.HTTP_ERRORS[0] = bundleGetter('ERR_0');
        dvh_utils.HTTP_ERRORS[1] = bundleGetter('ERR_generic');
    },

    // functia de incarcare a mesajelor de eroare
    loadBundles:function (lang) {
        dvh_utils.LANGUAGE = lang;
        jQuery.i18n.properties({
            name:'Messages',
            path:'common/bundle/',
            mode:'both',
            language:lang,
            callback:function () {
                dvh_utils.loadErrorMessages(jQuery.i18n.prop);
            }
        });
    },

    // functia de calcul hash
    calculateHash:function (str) {
        var hash = 0;
        if (str.length == 0) return hash;
        for (i = 0; i < str.length; i++) {
            char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        var returnHash = Math.abs(hash) + '';
        //while(returnHash.length < 10)
        //  returnHash = '0' + returnHash;
        if(returnHash.length > 5) {
            return returnHash.substr(returnHash.length - 5, returnHash.length);
        }
        else if(returnHash.length < 5) {
            while(returnHash.length < 5)
                returnHash = '0' + returnHash;
        }
        return returnHash;
    },

    composeHashString:function (parameters) {
        var params = '';

        for (key in parameters) {
            if (parameters[key] != null && parameters[key].length > 0)
                params += parameters[key];
        }
        return params;
    },
    // function exposed for the lazy loader
    runLazyMethod:function (url, parameters, returnFunction) {
        var request = $.ajax({
            type:"POST",
            dataType:"text",
            data:parameters,
            url:url
        });
        // alert('apelez ajaaax catre ' + url + ',param:' + parameters);
        request.fail(function (jqXHR, textStatus, errorThrown) {
            returnFunction(false, errorThrown, null);
        });
        request.done(function (httpObj, textStatus, obj) {
            if (obj != null && obj.status != null && obj.status == 200) {
                if(httpObj.indexOf(dvh_utils.SESSION_EXPIRED_MSG) != -1) {
                    //window.location.href = sessionScope.appContextRoot;
                    dvh_utils.sendMessage('clearCookies');
                    dvh_utils.sendMessage('setLoginBtnStatus#0');
                    if(sessionScope.currentPageId != "page_index")
                        alert('Your session has expired');
                    //alert(window.location.pathnamew);
                    $.mobile.changePage(sessionScope.appContextRoot +  "/login/login.html",
                        {   transition: "none", changeHash: false });
                    return;
                }

                var firstIndex = httpObj.indexOf("(");
                var lastIndex = httpObj.lastIndexOf(")");
                if (firstIndex != -1 && lastIndex != -1 && firstIndex + 1 < lastIndex) {
                    var rsp = jQuery.parseJSON(httpObj.substring(firstIndex + 1, lastIndex));
                    returnFunction(true, null, rsp);
                }
                else
                    returnFunction(false, dvh_utils.HTTP_ERRORS[1], null);
            }
            else {
                var err;
                if (dvh_utils.HTTP_ERRORS[obj.status] != null)
                    err = dvh_utils.HTTP_ERRORS[obj.status];
                else
                    err = dvh_utils.HTTP_ERRORS[1];
                returnFunction(false, err, null);
            }
        });
    }
};