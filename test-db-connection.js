// 数据库连接测试脚本
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 手动读取环境变量文件
function loadEnvFile() {
  // 尝试读取.env.local文件
  try {
    const envLocalPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            process.env[key] = valueParts.join('=');
          }
        }
      });
      console.log('✅ 成功读取.env.local文件');
    }
  } catch (error) {
    console.log('⚠️ 无法读取.env.local文件:', error.message);
  }
  
  // 尝试读取.env文件
  try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0 && !process.env[key]) {
            process.env[key] = valueParts.join('=');
          }
        }
      });
      console.log('✅ 成功读取.env文件');
    }
  } catch (error) {
    console.log('⚠️ 无法读取.env文件:', error.message);
  }
}

loadEnvFile();

async function testDatabaseConnection() {
  console.log('🔍 开始测试数据库连接...');
  
  // 检查环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('📋 环境变量检查:');
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ 已配置' : '❌ 未配置');
  console.log('- SUPABASE_ANON_KEY:', supabaseKey ? '✅ 已配置' : '❌ 未配置');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 环境变量配置不完整');
    return;
  }
  
  try {
    // 创建Supabase客户端
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试基本连接
    console.log('\n🔗 测试基本连接...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ 数据库连接失败:', healthError.message);
      return;
    }
    
    console.log('✅ 数据库连接成功');
    
    // 检查关键表是否存在
    console.log('\n📊 检查数据库表结构...');
    
    const tables = ['profiles', 'interview_questions', 'practice_sessions', 'interview_stages'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ 表 ${table}: ${error.message}`);
        } else {
          console.log(`✅ 表 ${table}: 存在且可访问`);
        }
      } catch (err) {
        console.log(`❌ 表 ${table}: 检查失败 - ${err.message}`);
      }
    }
    
    // 测试认证功能
    console.log('\n🔐 测试认证功能...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ 认证服务错误:', authError.message);
    } else {
      console.log('✅ 认证服务正常');
    }
    
    console.log('\n🎉 数据库连接测试完成!');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testDatabaseConnection();