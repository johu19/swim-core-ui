import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function App() {
  return (
    <main className="flex min-h-svh items-center justify-center px-5 py-10 sm:px-8">
      <Card className="w-full max-w-md border-primary/15 bg-white/88 shadow-[0_24px_60px_-32px_rgba(37,99,235,0.45)] backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto h-3 w-16 rounded-full bg-primary/20" />
          <CardTitle className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            Swim-Core-UI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-base leading-7 text-muted-foreground sm:text-lg">
            under development !
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

export default App
