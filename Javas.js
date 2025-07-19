
    function getColorByPercentage(p) {
        if (p < 30) return '#f44336';
        if (p < 70) return '#ff9800';
        return '#4caf50';
    }

    function procesarArchivo() {
        const archivo = document.getElementById('mppFile').files[0];
        if (!archivo) return alert("Selecciona un archivo XML exportado desde MS Project.");

        const reader = new FileReader();
        reader.onload = function(e) {
        const contenido = e.target.result;
        const parser = new DOMParser();
        const xml = parser.parseFromString(contenido, "text/xml");

        const tareas = xml.getElementsByTagName("Task");
        if (!tareas || tareas.length === 0) {
        document.getElementById("informe").innerHTML = "No se encontraron tareas.";
        return;
        }

        let completadoTotal = 0;
        let cantidadTareas = 0;
        let atrasadas = 0;
        let adelantadas = 0;
        let Terminadas = 0;
        let planificadoPorFecha = 0;
        let cantidadHitos = 0;
        let Porc = 0;

        let tareasCriticas = [];
        
        let finProyectoPlan = null;
        let finProyectoReal = null;
        let tipoPorc = 0;

        const hoy = new Date();

        for (let i = 1; i < tareas.length; i++) {
          const esResumen = tareas[i].getElementsByTagName("Summary")[0]?.textContent === "1";
          const esHito = tareas[i].getElementsByTagName("Milestone")[0]?.textContent === "1";
          if (esResumen) continue;

          const select = document.getElementById("tipoPorcentaje");
          console.log(select.value); // Muestra el valor seleccionado (por defecto el primero)
          if(select === "Porcentaje Trabajo") {tipoPorc = 1};
          

          if(tipoPorc === 0){
            const porcentaje = parseFloat(tareas[i].getElementsByTagName("PercentComplete")[0]?.textContent || 0);
            console.log(select.value); // Muestra el valor seleccionado (por defecto el primero)
          }else{
            const porcentaje = parseFloat(tareas[i].getElementsByTagName("PercentWorkComplete")[0]?.textContent || 0);
            console.log(select.value); // Muestra el valor seleccionado (por defecto el primero)
          }
          const porcentaje = parseFloat(tareas[i].getElementsByTagName("PercentComplete")[0]?.textContent || 0);
          const inicio = new Date(tareas[i].getElementsByTagName("Start")[0]?.textContent);
          const baselineStart = new Date(tareas[i].getElementsByTagName("Baseline")[0]?.getElementsByTagName("Start")[0]?.textContent);
          const fin = new Date(tareas[i].getElementsByTagName("Finish")[0]?.textContent);
          const baselineFinish = new Date(tareas[i].getElementsByTagName("Baseline")[0]?.getElementsByTagName("Finish")[0]?.textContent);
          const nombre = tareas[i].getElementsByTagName("Name")[0]?.textContent || "(Sin nombre)";
          const esCritica = tareas[i].getElementsByTagName("Critical")[0]?.textContent === "1";

          if (esHito) {
          cantidadHitos++;
          continue; // Si no quieres contar los hitos en las estadísticas generales
          }

          completadoTotal += porcentaje;
          cantidadTareas++;

          if (hoy > inicio) planificadoPorFecha += 100;

          if (porcentaje < 100 && fin > baselineFinish) atrasadas++;
          if (porcentaje > 0 && inicio < baselineStart) adelantadas++;
          // Contar tareas completadas
          if (porcentaje === 100) {Terminadas++;}

          if (esCritica) {
            tareasCriticas.push({ nombre, inicio: inicio.toLocaleDateString(), fin: fin.toLocaleDateString(), porcentaje });
          }

          for (let i = 0; i < tareas.length; i++) {
          const id = tareas[i].getElementsByTagName("ID")[0]?.textContent;
          if (id === "0") {
          // Fin real del proyecto (Finish)
          const finRealTexto = tareas[i].getElementsByTagName("Finish")[0]?.textContent;
          finProyectoReal = new Date(finRealTexto);
          const porcentajeR = parseFloat(tareas[i].getElementsByTagName("PercentComplete")[0]?.textContent || 0);
          Porc = new Number(porcentajeR).toFixed(2);

          // Fin planificado desde Baseline
          const baseline = tareas[i].getElementsByTagName("Baseline")[0];
          const finPlanTexto = baseline.getElementsByTagName("Finish")[0]?.textContent;
          finProyectoPlan = new Date(finPlanTexto);
          break; // Ya encontramos el ID 1
          }
          }


          if (porcentaje < 100 && hoy > fin) {
            const diasDesfase = Math.ceil((hoy - fin) / (1000 * 60 * 60 * 24));
            desfases.push({ nombre, fin: fin.toLocaleDateString(), desfase: diasDesfase });
          }
        }

        const promedio = (completadoTotal / cantidadTareas).toFixed(2);
        const planificado = (planificadoPorFecha / (cantidadTareas * 100) * 100).toFixed(2);
        const diasDiferencia = finProyectoReal && finProyectoPlan ? Math.ceil((finProyectoReal - finProyectoPlan) / (1000 * 60 * 60 * 24)) : 0;
        const estado = diasDiferencia > 0 ? '🔺 Atrasado' : diasDiferencia < 0 ? '✅ Adelantado' : '🟡 Sin variación';

        document.getElementById("informe").innerHTML = `
          <h3>Resumen del proyecto</h3>
          <p><strong>Tareas totales:</strong> ${cantidadTareas}</p>
          <p><strong>Hitos:</strong> ${cantidadHitos}</p>
          <p><strong>Avance real:</strong> ${Porc}%</p>
          <p><strong>Avance esperado (según fecha Corte):</strong> ${planificado}%</p>
          <p><strong>Tareas atrasadas:</strong> ${atrasadas}</p>
          <p><strong>Tareas adelantadas:</strong> ${adelantadas}</p>
          <p><strong>Tareas Terminadas:</strong> ${Terminadas}</p>
        `;

        const barra = document.getElementById("barraProgreso");
        barra.style.width = Porc + "%";
        barra.textContent = Porc + "%";
        barra.style.backgroundColor = getColorByPercentage(Porc);

        const ctxBarras = document.getElementById('graficoBarras').getContext('2d');
        new Chart(ctxBarras, {
          type: 'bar',
          data: {
            labels: ['Tareas Atrasadas', 'Tareas Adelantadas', 'Tareas Terminadas'],
            datasets: [{
              label: 'Cantidad de Tareas',
              data: [atrasadas, adelantadas, Terminadas],
              backgroundColor: ['#F44336', '#2196F3', "#4caf50"]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              title: {
                display: true,
                text: 'Tareas por Estado'
              }
            },
            scales: {
              y: { beginAtZero: true }
            }
          }
        });

        // Tabla de tareas críticas
        let tablaHtml = '<table><tr><th>Nombre</th><th>Inicio</th><th>Fin</th><th>% Completado</th></tr>';
        tareasCriticas.forEach(t => {
        tablaHtml += `<tr><td>${t.nombre}</td><td>${t.inicio}</td><td>${t.fin}</td><td>${t.porcentaje}%</td></tr>`;
        });
        tablaHtml += '</table>';
        document.getElementById("tablaCriticas").innerHTML = tablaHtml;

        // Tabla de desfase
        let tablaHtml2 = '<table><tr><th>Fin Planificado</th><th>Fin Real</th><th>Desfase</th><th>Estado</th></tr>';
        tablaHtml2 += `<tr>
        <td>${finProyectoPlan ? finProyectoPlan.toLocaleDateString() : 'N/D'}</td>
        <td>${finProyectoReal ? finProyectoReal.toLocaleDateString() : 'N/D'}</td>
        <td>${diasDiferencia}</td>
        <td>${estado}</td>
        </tr></table>`;
        document.getElementById("tablaDesfase").innerHTML = tablaHtml2;

        };
        reader.readAsText(archivo);
    }