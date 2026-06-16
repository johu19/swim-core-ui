import { AuthCardLayout } from '@/features/auth/components/auth-card-layout'

type ConfigErrorScreenProps = {
  missingEnv: string[]
}

export function ConfigErrorScreen({ missingEnv }: ConfigErrorScreenProps) {
  return (
    <AuthCardLayout
      cardClassName="max-w-lg"
      headerAlignment="left"
      title="Cognito setup incomplete"
      titleClassName="text-2xl sm:text-2xl"
      description="Add the missing Vite environment variables before testing login."
    >
      <ul className="space-y-2 rounded-xl bg-primary/5 p-4 text-sm text-muted-foreground">
        {missingEnv.map((envKey) => (
          <li key={envKey} className="font-mono">
            {envKey}
          </li>
        ))}
      </ul>
    </AuthCardLayout>
  )
}
