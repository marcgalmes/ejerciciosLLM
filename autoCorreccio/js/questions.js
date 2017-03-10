var formElement=null;
var contadorLabelfor = 0;//contador label for para que no se repitan
var nota = 0;  //nota de la prueba sobre 10 puntos (hay 10 preguntas)
var mostrarerrores = true;
var preguntas = null;//preguntas xml
var divsPreguntas = null;//preguntas html
var respuestas = {};//{pregunta: respuesta}

//**************************************************************************************************** 
//Después de cargar la página (onload) se definen los eventos sobre los elementos entre otras acciones.
window.onload = function(){ 

 //CORREGIR al apretar el botón
 formElement=document.getElementById('formExamen');
 formElement.onsubmit=function(){
     return false;
 }
 document.getElementById("btnEnviar").onclick = function() {
     if (comprobar()){
        corregir();
        //presentarNota();
        document.getElementById("btnEnviar").value = "Repetir examen";
        document.getElementById("btnEnviar").onclick = function() {window.location.reload();}

   }
   return false;
 }
 
 //LEER XML de xml/preguntas.xml
 var xhttp = new XMLHttpRequest();
 xhttp.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200) {
   gestionarXml(this);
  }
 };
 xhttp.open("GET", "xml/preguntas.xml", true);
 xhttp.send();
}

//****************************************************************************************************
// Recuperamos los datos del fichero XML xml/preguntas.xml
// xmlDOC es el documento leido XML. 
function gestionarXml(dadesXml){
 var xmlDoc = dadesXml.responseXML; //Parse XML to xmlDoc
 if (xmlDoc == undefined ) {
     mostrarError("no hay xml.")
     return;
 }
 
 var tipos = {};//contendra el html para cada tipo
 
 if (document.getElementsByClassName("pregunta").length<5){//tienen q estar los 5 tipos
     mostrarError("faltan tipos de pregunta en el documento.")
 }
 
 //el html ya tiene los 5 tipos (hidden), asi q solo buscamos cada pregunta de cada tipo
 tipos["radio"]             = document.getElementsByClassName("pregunta tipoRadio")                 [0] ;
 tipos["text"]              = document.getElementsByClassName("pregunta tipoText")                  [0] ;
 tipos["select"]            = document.getElementsByClassName("pregunta tipoSelect")                [0] ;
 tipos["select multiple"]   = document.getElementsByClassName("pregunta tipoSelectMultiple")         [0] ;
 tipos["checkbox"]          = document.getElementsByClassName("pregunta tipoCheckbox")              [0] ;
 
 
 //variable preguntas: todas las etiquietas <question> del xml
 //divsPreguntas: todos los divs del html con clase "pregunta"
 preguntas = xmlDoc.getElementsByTagName("question");
 divsPreguntas = []
 
 //recorremos preguntas del xml
 for (i = 0; i < preguntas.length; i++) {
     var div    = document.createElement("div");
     var preg   = preguntas[i];
     
     divsPreguntas[i] = div;
     
     var t = preguntas[i].getElementsByTagName("type");
     var q = preguntas[i].getElementsByTagName("title");
     var a = preguntas[i].getElementsByTagName("answer");
     var o = preguntas[i].getElementsByTagName("option");
     
     respuestas[i] = a;
     if (t.length==0) {
         mostrarError("el xml no está bien.");
         return;
     }
     
     var tipo = t[0].innerHTML;
     
     if (!(tipo in tipos)) {
         mostrarError("hay un tipo incorrecto.")
         return;
     }
     
     var modelo = tipos[tipo];
     if (modelo == undefined) {
         mostrarError("falta un tipo en el documento.")
     }
     
     div.innerHTML = modelo.innerHTML;
     div.setAttribute("class",modelo.getAttribute("class"));
     div.setAttribute("id","preg_"+preg.getAttribute("id"));
     
     //poner texto de las preguntas
     div.getElementsByClassName("textPregunta")[0].innerHTML = 
     "<span class=\"numPregunta\">"+String(i+1)+"</span>"+q[0].innerHTML;
     
     document.getElementById("pagina").appendChild(div);
     if (tipo=="radio" || tipo=="checkbox") {
         var labelMod = modelo.getElementsByTagName("label")[0];
         for (j = 0; j < o.length; j++) {
             if (labelMod==undefined) break;
             //creamos elemento label
             var label = document.createElement("label");
             //definimos un valor for único, usando un contador 
             var valorFor = labelMod.getAttribute("for")+String(contadorLabelfor);
             contadorLabelfor+=1;
             label.setAttribute("for",valorFor);
             //copiamos el html del label
             label.innerHTML = labelMod.innerHTML;
             var input = label.getElementsByTagName("input")[0];
             input.setAttribute("id",valorFor)
             input.setAttribute("name","pregunta "+String(i))
             //añadimos el texto de la opcion
             label.getElementsByClassName("opcion")[0].getElementsByTagName("span")[0].innerHTML = o[j].innerHTML;
             //añadimos el label al div correspondiente
             div.appendChild(label);
         }
     }
     else if (tipo.includes("select")) {
         for (j = 0; j < o.length; j++) {
             var optionMod = modelo.getElementsByTagName("option")[0];
             if (optionMod==undefined) break;
             //creamos elemento option
             var option = document.createElement("option");
             option.className = optionMod.className;
             //añadimos el texto de la opcion
             option.innerHTML = o[j].innerHTML;
             //añadimos el label al div correspondiente
             div.getElementsByTagName("select")[0].appendChild(option);
         }
     }//
 }
 
 //ahora borramos las preguntas de los tipos
 for (t in tipos) {
     tipos[t].remove();
 }
 //tambien borramos los label sin numero
 var labels = document.getElementsByTagName("label");
 for (i = 0; i < labels.length; i++) {
     var l = labels[i];
     if (l.getAttribute("for").match(/\d+/g)==null) {
         l.remove();
     }
 }
 //y los option de modelo
 var selects = document.getElementsByTagName("select");
 for (i = 0; i < selects.length; i++) {
     selects[i].getElementsByTagName("option")[0].remove();
 }
 
 //ponemos el button sumit al final
 
 document.getElementById("pagina").appendChild(document.getElementById("btnEnviar"));
 //ya se puede mostrar la pagina
 document.getElementById("pagina").removeAttribute("hidden");
$('option').mousedown(function(e) {
    e.preventDefault();
    $(this).prop('selected', $(this).prop('selected') ? false : true);
    return false;
});

}

//****************************************************************************************************
//implementación de la corrección

function corregir() {
    for (i = 0; i < divsPreguntas.length; i++) {
        div = divsPreguntas[i];
        inputs = div.getElementsByTagName("input");
        resp = respuestas[i];
        respuestaCorrecta = true;
        //corregir text, radio, checkbox
        for (j = 0; j < inputs.length; j++) {
            input = inputs[j];
            inputCorrecto = false;
            if (input.getAttribute("type")=="text") {
                if (input.value!=resp[0].innerHTML) {
                    respuestaCorrecta = false;
                }
                break;
            } else {
                for (k = 0; k < resp.length; k++) {
                    if (resp[k].innerHTML == String(j)) {
                        inputCorrecto = true;
                        break;
                    }
                }
                if (inputCorrecto != input.checked) {
                    respuestaCorrecta = false;
                }
            }
        }
        //corregir selects
        options = div.getElementsByTagName("option");
        for (j = 0; j < options.length; j++) {
            option= options[j];
            optionCorrecto = false;
        
            for (k = 0; k < resp.length; k++) {
                if (resp[k].innerHTML == String(j)) {
                    optionCorrecto= true;
                    break;
                }
            }
            if (optionCorrecto != option.selected) {
                respuestaCorrecta = false;
            }
        
        }
        
        div.getElementsByClassName("correcto")[0].removeAttribute("hidden");
        if (!respuestaCorrecta) {
            div.getElementsByClassName("correcto")[0].innerHTML = "¡Incorrecto!";
            div.getElementsByClassName("correcto")[0].style.backgroundColor = "#f0a0a0";
        }
    }
}

function corregirSelect(){
  //Compara el índice seleccionado con el valor del íncide que hay en el xml (<answer>2</answer>)
  //para implementarlo con type radio, usar value para enumerar las opciones <input type='radio' value='1'>...
  //luego comparar ese value con el value guardado en answer
  var sel = formElement.elements[1];  
  if (sel.selectedIndex-1==respuestaSelect) { //-1 porque hemos puesto una opción por defecto en el select que ocupa la posición 0
   darRespuestaHtml("P2: Correcto");
   nota +=1;
  }
  else darRespuestaHtml("P2: Incorrecto");
}

//Si necesitáis ayuda para hacer un corregirRadio() decirlo, lo ideal es que a podáis construirla modificando corregirCheckbox
function corregirCheckbox(){
  //Para cada opción mira si está checkeada, si está checkeada mira si es correcta y lo guarda en un array escorrecta[]
  var f=formElement;
  var escorrecta = [];
  for (i = 0; i < f.color.length; i++) {  //"color" es el nombre asignado a todos los checkbox
   if (f.color[i].checked) {
    escorrecta[i]=false;     
    for (j = 0; j < respuestasCheckbox.length; j++) {
     if (i==respuestasCheckbox[j]) escorrecta[i]=true;
    }
    //si es correcta sumamos y ponemos mensaje, si no es correcta restamos y ponemos mensaje.
    if (escorrecta[i]) {
     nota +=1.0/respuestasCheckbox.length;  //dividido por el número de respuestas correctas   
     darRespuestaHtml("P3: "+i+" correcta");    
    } else {
     nota -=1.0/respuestasCheckbox.length;  //dividido por el número de respuestas correctas   
     darRespuestaHtml("P3: "+i+" incorrecta");
    }   
   } 
  }
}

//Comprobar que se han introducido datos en el formulario
function comprobar(){
    for (i = 0; i < divsPreguntas.length; i++) {
       var pregunta = divsPreguntas[i];
       var inputs = pregunta.getElementsByTagName("input");
       if (inputs.length==0) continue;
       //si el input es de radio o checkbox
       if (inputs[0].getAttribute("type") in {"radio":0,"checkbox":1}) {
           if ($('input[name=\"'+inputs[0].getAttribute("name")+'\"]:checked').length == 0) {
                mostrarError("<b><u>faltan marcar algunos inputs</u></b>");
                //marcar en rojo
                inputs[0].parentNode.style.backgroundColor = "#ff0000";
                document.getElementById("info").innerHTML = "Selecciona alguna opción de las preguntas en rojo para poder corregir.";
                document.documentElement.scrollIntoView();
                return false;
            } 
            else {
                inputs[0].parentNode.style.backgroundColor = "";
                }
        }
        else {//si es de texto
            if (inputs[0].value=="") {
                mostrarError("<b><u>faltan escribir algunas respuestas</u></b>")
                inputs[0].parentNode.style.backgroundColor = "#ff0000";
                document.getElementById("info").innerHTML = "Escribe algo en las preguntas en rojo para poder corregir.";
                document.documentElement.scrollIntoView();
                return false;
            }
            else {
                inputs[0].parentNode.style.backgroundColor = "";
                }
        }
       
   }
   return true;
   
}

//muestra errores arriba

function mostrarError(error) {
    console.log("Error: "+error);
    if (mostrarerrores) {
        document.getElementById("errores").style.animationName = "animError";
        document.getElementById("errores").removeAttribute("hidden");
        document.getElementById("errores").getElementsByTagName("span")[0].innerHTML="No se puede cargar el examen ya que "+error;
    }
}
