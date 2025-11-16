import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting data sync to company database...');

    // Initialize Lovable Cloud (source) client
    const lovableClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize Company Supabase (destination) client
    const companyClient = createClient(
      Deno.env.get('COMPANY_SUPABASE_URL') ?? '',
      Deno.env.get('COMPANY_SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const tablesToSync = [
      'deals',
      'monthly_targets',
      'quarterly_targets',
      'monthly_kpis',
      'profiles',
      'user_roles',
      'affiliate_names'
    ];

    const results = [];

    for (const tableName of tablesToSync) {
      console.log(`Syncing table: ${tableName}`);
      
      // Get last sync time for this table
      const { data: syncLog, error: syncLogError } = await lovableClient
        .from('sync_log')
        .select('last_synced_at')
        .eq('table_name', tableName)
        .single();

      if (syncLogError) {
        console.error(`Error fetching sync log for ${tableName}:`, syncLogError);
        results.push({ table: tableName, status: 'error', error: syncLogError.message });
        continue;
      }

      const lastSyncedAt = syncLog.last_synced_at;
      console.log(`Last sync for ${tableName}: ${lastSyncedAt}`);

      // Fetch new records created after last sync
      const { data: newRecords, error: fetchError } = await lovableClient
        .from(tableName)
        .select('*')
        .gt('created_at', lastSyncedAt)
        .order('created_at', { ascending: true });

      if (fetchError) {
        console.error(`Error fetching new records from ${tableName}:`, fetchError);
        results.push({ table: tableName, status: 'error', error: fetchError.message });
        continue;
      }

      if (!newRecords || newRecords.length === 0) {
        console.log(`No new records to sync for ${tableName}`);
        results.push({ table: tableName, status: 'success', recordsSynced: 0 });
        continue;
      }

      console.log(`Found ${newRecords.length} new records in ${tableName}`);

      // Insert records into company database
      const { error: insertError } = await companyClient
        .from(tableName)
        .upsert(newRecords, { onConflict: 'id' });

      if (insertError) {
        console.error(`Error inserting records into company ${tableName}:`, insertError);
        results.push({ 
          table: tableName, 
          status: 'error', 
          error: insertError.message,
          recordsAttempted: newRecords.length 
        });
        continue;
      }

      // Update sync log with latest timestamp
      const latestCreatedAt = newRecords[newRecords.length - 1].created_at;
      const { error: updateLogError } = await lovableClient
        .from('sync_log')
        .update({ 
          last_synced_at: latestCreatedAt,
          last_sync_status: 'success',
          records_synced: newRecords.length
        })
        .eq('table_name', tableName);

      if (updateLogError) {
        console.error(`Error updating sync log for ${tableName}:`, updateLogError);
      }

      console.log(`Successfully synced ${newRecords.length} records for ${tableName}`);
      results.push({ 
        table: tableName, 
        status: 'success', 
        recordsSynced: newRecords.length,
        latestTimestamp: latestCreatedAt
      });
    }

    const summary = {
      timestamp: new Date().toISOString(),
      totalTables: tablesToSync.length,
      results: results,
      totalRecordsSynced: results.reduce((sum, r) => sum + (r.recordsSynced || 0), 0)
    };

    console.log('Sync completed:', JSON.stringify(summary, null, 2));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in sync-to-company-db function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
