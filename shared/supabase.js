// Supabase 클라이언트 설정
const { createClient } = require('@supabase/supabase-js');

// 환경 변수에서 Supabase 설정 가져오기
// .env 파일에 다음을 추가하세요:
// SUPABASE_URL=your_supabase_url
// SUPABASE_ANON_KEY=your_supabase_anon_key

const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.warn('⚠️ Supabase 설정이 필요합니다. .env 파일에 SUPABASE_URL과 SUPABASE_ANON_KEY를 설정하세요.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
