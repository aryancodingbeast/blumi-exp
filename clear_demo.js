import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function clearTable() {
    console.log('Fetching products to delete...')
    const { data: products, error: fetchError } = await supabase.from('products').select('id')

    if (fetchError) {
        console.error('Error fetching products:', fetchError)
        return
    }

    if (products && products.length > 0) {
        console.log(`Found ${products.length} products. Deleting...`)
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .in('id', products.map(p => p.id))

        if (deleteError) {
            console.error('Error deleting products:', deleteError)
        } else {
            console.log('Successfully deleted all demo products.')
        }
    } else {
        console.log('No products found.')
    }
}

clearTable()
