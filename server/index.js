import express from 'express'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const app = express()
const PORT = process.env.PORT || 5000

// Initialize Supabase with proper error handling
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('Missing Supabase configuration in .env file')
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Service role client for admin operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null

// Middleware
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', supabaseConnected: !!supabase })
})

// Admin setup endpoint
app.post('/api/admin/setup', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Admin client not configured' })
    }
    
    const { email, password } = req.body
    
    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
      email: 'info@legacy3x.com',
      password: 'secureAdminPassword123!',
      options: {
        data: {
          is_admin: true
        }
      }
    })

    if (authError) throw authError

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'admin',
        granted_by: authData.user.id
      })

    if (roleError) throw roleError

    res.status(201).json({ 
      message: 'Admin account created successfully', 
      user: authData.user 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Supabase connected to: ${process.env.SUPABASE_URL}`)
})
