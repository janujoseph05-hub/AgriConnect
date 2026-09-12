import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../services/api'
import { useAuth } from '../context/useAuth'
import './Auth.css'

function Login() {
  const navigate = useNavigate()
  const { setAuthenticatedUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await loginUser(form)
      setAuthenticatedUser(response.user)
      const destination = response.user.role === 'farmer'
        ? '/farmer-dashboard'
        : response.user.role === 'fpo'
          ? '/fpo-dashboard'
          : '/marketplace'
      navigate(destination)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-brand">AgriConnect</div>
        <div className="auth-card">
          <h1 id="login-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to continue to your agri marketplace.</p>
          {error && <div className="auth-message auth-error" role="alert">{error}</div>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} required autoComplete="email" />
            </label>
            <label className="auth-field">
              Password
              <input name="password" type="password" value={form.password} onChange={updateField} required autoComplete="current-password" />
            </label>
            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          <p className="auth-footer">New to AgriConnect? <Link to="/register">Create an account</Link></p>
        </div>
      </section>
    </main>
  )
}

export default Login