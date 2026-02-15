import { createRoute } from 'honox/factory'

function SampleScreen() {
  const features = [
    'Honox のファイルベースルーティング',
    'React コンポーネントで画面を記述',
    'レイアウトは _renderer.tsx で共通化'
  ]

  return (
    <main className="card">
      <h1>Honox + React Sample</h1>
      <p>このページは Honox でレンダリングされています。</p>
      <ul>
        {features.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  )
}

export default createRoute((c) => {
  return c.render(<SampleScreen />, { title: 'Honox React Sample' })
})
