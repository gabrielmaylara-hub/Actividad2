// Representa una tarea y las acciones que pueden realizarse sobre ella.
class Tarea {
  constructor(nombre, completa = false, id = null) {
    this.id = id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.nombre = nombre;
    this.completa = completa;
  }

  cambiarEstado() {
    this.completa = !this.completa;
  }

  editar(nuevoNombre) {
    this.nombre = nuevoNombre;
  }

  eliminar(lista) {
    return lista.filter(tarea => tarea.id !== this.id);
  }
}

// Lleva el registro de las tareas y actualiza la página.
class GestorDeTareas {
  constructor() {
    this.tareas = [];
    this.lista = document.querySelector('#lista-tareas');
    this.mensaje = document.querySelector('#mensaje');
  }

  // Las promesas permiten completar la lectura antes de dibujar la lista.
  cargar() {
    return Promise.resolve().then(() => {
      try {
        const guardadas = JSON.parse(localStorage.getItem('mis-tareas') || '[]');
        if (!Array.isArray(guardadas)) throw new Error('Formato no válido');
        this.tareas = guardadas
          .filter(dato => dato && typeof dato.nombre === 'string' && typeof dato.id === 'string')
          .map(dato => new Tarea(dato.nombre, Boolean(dato.completa), dato.id));
      } catch (error) {
        this.tareas = [];
        this.mostrarMensaje('No se pudieron recuperar las tareas guardadas.');
      }
      this.render();
    });
  }

  guardar() {
    return Promise.resolve().then(() => {
      try {
        localStorage.setItem('mis-tareas', JSON.stringify(this.tareas));
      } catch (error) {
        this.mostrarMensaje('No fue posible guardar los cambios en este navegador.');
      }
    });
  }

  mostrarMensaje(texto) {
    this.mensaje.textContent = texto;
  }

  agregarTarea(nombre) {
    const limpio = nombre.trim();
    if (!limpio) {
      this.mostrarMensaje('Escribe una tarea antes de agregarla.');
      return false;
    }
    this.tareas.push(new Tarea(limpio));
    this.render();
    this.guardar();
    this.mostrarMensaje('');
    return true;
  }

  editarTarea(id, nombre) {
    const limpio = nombre.trim();
    if (!limpio) {
      this.mostrarMensaje('Escribe un nombre para la tarea.');
      return false;
    }
    const tarea = this.tareas.find(item => item.id === id);
    if (!tarea) return false;
    tarea.editar(limpio);
    this.render();
    this.guardar();
    this.mostrarMensaje('');
    return true;
  }

  eliminarTarea(id) {
    const tarea = this.tareas.find(item => item.id === id);
    if (!tarea) return;
    this.tareas = tarea.eliminar(this.tareas);
    this.render();
    this.guardar();
    this.mostrarMensaje('');
  }

  cambiarEstado(id) {
    const tarea = this.tareas.find(item => item.id === id);
    if (!tarea) return;
    tarea.cambiarEstado();
    this.render();
    this.guardar();
    this.mostrarMensaje('');
  }

  iniciarEdicion(id) {
    const tarea = this.tareas.find(item => item.id === id);
    const fila = [...this.lista.children].find(li => li.dataset.id === id);
    if (!tarea || !fila) return;
    const contenido = fila.querySelector('.descripcion');
    const acciones = fila.querySelector('.acciones');
    const formulario = document.createElement('form');
    formulario.className = 'edicion';
    const entrada = document.createElement('input');
    entrada.type = 'text';
    entrada.maxLength = 120;
    entrada.value = tarea.nombre;
    entrada.setAttribute('aria-label', 'Editar nombre de la tarea');
    const campo = document.createElement('div');
    campo.className = 'edicion-campo';
    const error = document.createElement('p');
    error.className = 'error-edicion';
    error.setAttribute('role', 'alert');
    campo.append(entrada, error);
    const guardar = document.createElement('button');
    guardar.type = 'submit';
    guardar.className = 'boton principal';
    guardar.textContent = 'Guardar';
    const cancelar = document.createElement('button');
    cancelar.type = 'button';
    cancelar.className = 'boton';
    cancelar.textContent = 'Cancelar';
    formulario.append(campo, guardar, cancelar);
    contenido.replaceWith(formulario);
    acciones.hidden = true;
    cancelar.addEventListener('click', () => this.render());
    entrada.addEventListener('input', () => { error.textContent = ''; });
    formulario.addEventListener('submit', evento => {
      evento.preventDefault();
      if (!entrada.value.trim()) {
        error.textContent = 'Escribe un nombre para la tarea.';
        entrada.focus();
        return;
      }
      this.editarTarea(id, entrada.value);
    });
    entrada.focus();
    entrada.select();
  }

  render() {
    this.lista.replaceChildren();
    this.tareas.forEach(tarea => {
      const fila = document.createElement('li');
      fila.dataset.id = tarea.id;
      if (tarea.completa) fila.classList.add('completada');
      // Se utiliza un template literal para generar la estructura de cada tarea.
      fila.innerHTML = `
        <label class="descripcion">
          <input type="checkbox" ${tarea.completa ? 'checked' : ''} aria-label="${tarea.completa ? 'Marcar como pendiente' : 'Marcar como completada'}">
          <span class="texto-tarea"></span>
        </label>
        <div class="acciones">
          <button type="button" class="boton editar">Editar</button>
          <button type="button" class="boton peligro eliminar">Eliminar</button>
        </div>`;
      // textContent evita interpretar el nombre escrito como código HTML.
      fila.querySelector('.texto-tarea').textContent = tarea.nombre;
      fila.querySelector('input').addEventListener('change', () => this.cambiarEstado(tarea.id));
      fila.querySelector('.editar').addEventListener('click', () => this.iniciarEdicion(tarea.id));
      fila.querySelector('.eliminar').addEventListener('click', () => this.eliminarTarea(tarea.id));
      this.lista.appendChild(fila);
    });
    document.querySelector('#sin-tareas').hidden = this.tareas.length > 0;
    let pendientes = 0;
    this.tareas.forEach(tarea => {
      if (!tarea.completa) pendientes++;
    });
    const completas = this.tareas.length - pendientes;
    document.querySelector('#resumen').textContent = `${pendientes} pendientes · ${completas} completadas`;
  }
}

const gestor = new GestorDeTareas();
gestor.cargar();
document.querySelector('#formulario-tarea').addEventListener('submit', evento => {
  evento.preventDefault();
  const campo = document.querySelector('#nueva-tarea');
  if (gestor.agregarTarea(campo.value)) campo.value = '';
  campo.focus();
});
