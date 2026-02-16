import { createRoute } from 'honox/factory'

export default createRoute((c) => {
  return c.render(
    <section>
      <h1>Contact Form Sample</h1>
      <p>HonoX + SolidJS + PicoCSS + Valibot</p>
      <div id='app'></div>
    </section>
  )
})
