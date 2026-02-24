import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet } from 'lucide-react'

export default function LoggedOutState() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email, 
          password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        alert('בדוק את המייל שלך לאימות החשבון')
      }
      window.location.reload()
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? 'התחברות' : 'הרשמה'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label>שם מלא</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label>אימייל</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>סיסמה</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'טוען...' : isLogin ? 'התחבר' : 'הרשם'}
            </Button>
            <Button type="button" variant="ghost" className="w-full"
              onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'אין לך חשבון? הרשם' : 'יש לך חשבון? התחבר'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
