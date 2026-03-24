const { Router } = require("express");
const supabase = require("../lib/supabase");

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, full_name, role } = req.body;
  try {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return res.json({ success: false, error: authError.message });
    }

    const user = authData.user;

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: user.id, email, full_name, role });

    if (profileError) {
      return res.json({ success: false, error: profileError.message });
    }

    return res.json({ success: true, user: { id: user.id, email, role } });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return res.json({ success: false, error: error.message });
    }

    return res.json({ success: true, session: data.session, user: data.user });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      return res.json({ success: false, error: userError.message });
    }

    const user = userData.user;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return res.json({ success: false, error: profileError.message });
    }

    return res.json({ success: true, user, profile });
  } catch (err) {
    return res.json({ success: false, error: err.message });
  }
});

module.exports = router;
