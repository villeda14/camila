/* =====================================================
   ✏️  AQUÍ EDITAS TODO LO PERSONAL
   ===================================================== */
export const CONFIG = {
  nombre: 'Camila',
  autor: 'Josué',

  // Tu canción (audio extraído de tu video)
  // La película dura EXACTAMENTE lo que dura la canción.
  cancion: 'assets/musica/cancion.m4a',

  // ---------- LA PELÍCULA ----------
  tituloPelicula: ['Una película de', 'JOSUÉ'],
  subtituloPelicula: 'protagonizada por Camila',

  // Fotos de ustedes: súbelas a assets/fotos/ y agrégalas aquí.
  // Ejemplo: { src: 'assets/fotos/01.jpg', pie: 'El día que nos conocimos' }
  // El tiempo de cada foto se calcula solo para que todas quepan en la canción.
  // (puedes agregar pie:'texto' a cualquiera para ponerle subtítulo)
  fotos: [
    { src: 'assets/fotos/foto-01.jpg' },
    { src: 'assets/fotos/foto-02.jpg' },
    { src: 'assets/fotos/foto-03.jpg' },
    { src: 'assets/fotos/foto-04.jpg' },
    { src: 'assets/fotos/foto-05.jpg' },
    { src: 'assets/fotos/foto-06.jpg' },
    { src: 'assets/fotos/foto-07.jpg' },
    { src: 'assets/fotos/foto-08.jpg' },
    { src: 'assets/fotos/foto-09.jpg' },
    { src: 'assets/fotos/foto-10.jpg' },
    { src: 'assets/fotos/foto-11.jpg' },
    { src: 'assets/fotos/foto-12.jpg' },
    { src: 'assets/fotos/foto-13.jpg' },
    { src: 'assets/fotos/foto-14.jpg' },
    { src: 'assets/fotos/foto-15.jpg' },
    { src: 'assets/fotos/foto-16.jpg' },
    { src: 'assets/fotos/foto-17.jpg' },
    { src: 'assets/fotos/foto-18.jpg' }
  ],
  // Mientras no haya fotos, la película muestra estas escenas de ejemplo:
  pieEjemplo: ['Capítulo 1 · Donde todo empezó', 'Capítulo 2 · Las risas', 'Capítulo 3 · Los planes', 'Capítulo 4 · Contigo todo se arma mejor'],

  // Si todavía no hay canción (modo de prueba): segundos por foto
  segundosPorFotoSinCancion: 5,

  // Garabatos de crayón que aparecen sobre las fotos
  garabatos: true,
  garabatosTexto: ['te quiero', 'mi persona favorita', 'contigo siempre'],

  finPelicula: ['FIN', '(o mejor dicho: continuará…)'],
  mensajeFinal: 'Gracias por quedarte hasta el final, Camila.'
};
