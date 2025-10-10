// في كل صفحة تحتاج تسجيل دخول
const { data: { user } } = await supabase.auth.getUser();

if (user) {
  // تحقق إذا المستخدم نشط ولا منعطل
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .single();

  // إذا كان غير نشط، سجله للخروج
  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }
}
