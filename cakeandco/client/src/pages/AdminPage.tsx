import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Container, AppBar, Toolbar, Typography, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert, CircularProgress, CardMedia,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  login, fetchMe,
  fetchAdminCakes, createCake, updateCake, deleteCake,
  fetchAdminReservations, updateReservationStatus,
  fetchUsers, createUser, updateUser, deleteUser,
} from "../services/api";
import type { Cake, Reservation } from "../types";

const STATUS_LABELS: Record<string, { label: string; color: any }> = {
  PENDING: { label: "待确认", color: "warning" },
  PENDING_AI: { label: "AI 定制", color: "secondary" },
  CONFIRMED: { label: "已确认", color: "info" },
  MAKING: { label: "制作中", color: "primary" },
  READY: { label: "待取货", color: "secondary" },
  COMPLETED: { label: "已完成", color: "success" },
  CANCELLED: { label: "已取消", color: "default" },
};

const API_BASE = "/cake-api";

type AuthUser = { id: string; username: string; role: string } | null;

export default function AdminPage() {
  const [user, setUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchMe().then((u) => { setUser(u); setLoading(false); }).catch(() => { setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    const result = await login(username, password);
    localStorage.setItem("auth_token", result.token);
    setUser(result.user);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
  };

  if (loading) return <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}><CircularProgress sx={{ color: "#C8A45C" }} /></Box>;
  if (!user) return <LoginPage onLogin={handleLogin} />;
  return <AdminPanel user={user} onLogout={handleLogout} />;
}

function LoginPage({ onLogin }: { onLogin: (u: string, p: string) => Promise<void> }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) { setError("请输入用户名和密码"); return; }
    setLoading(true);
    try { await onLogin(username, password); } catch (e: any) { setError(e?.response?.data?.message || "登录失败"); }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "background.default" }}>
      <Paper sx={{ p: 4, maxWidth: 360, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 1, fontFamily: "Georgia, serif" }}>Cake &amp; Co.</Typography>
        <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>管理后台</Typography>
        <TextField label="用户名" value={username} onChange={(e) => { setUsername(e.target.value); setError(""); }} fullWidth autoFocus sx={{ mb: 2 }} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        <TextField label="密码" type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} fullWidth sx={{ mb: 2 }} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        {error && <Typography color="error" variant="body2" sx={{ mb: 2 }}>{error}</Typography>}
        <Button variant="contained" fullWidth onClick={handleSubmit} disabled={loading} sx={{ bgcolor: "#3C2415" }}>{loading ? "登录中..." : "登录"}</Button>
      </Paper>
    </Box>
  );
}

function AdminPanel({ user, onLogout }: { user: NonNullable<AuthUser>; onLogout: () => void }) {
  const [tab, setTab] = useState(0);
  const isAdmin = user.role === "ADMIN";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" sx={{ bgcolor: "#3C2415" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontFamily: "Georgia, serif" }}>Cake &amp; Co.</Typography>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{user.username} ({user.role})</Typography>
            <Button size="small" onClick={onLogout} startIcon={<LogoutIcon />} sx={{ color: "white", fontSize: 11 }}>退出</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ pt: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="🍰 蛋糕" />
          <Tab label="📋 预约" />
          {isAdmin && <Tab label="👥 用户" />}
        </Tabs>

        {tab === 0 && <CakeTab />}
        {tab === 1 && <ReservationTab />}
        {tab === 2 && isAdmin && <UserTab />}
      </Container>
    </Box>
  );
}

function CakeTab() {
  const [cakes, setCakes] = useState<Cake[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [edit, setEdit] = useState<Cake | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => { setLoading(true); try { setCakes(await fetchAdminCakes()); } catch { setSnack({ msg: "加载失败", severity: "error" }); } setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (cake: Cake) => {
    if (!window.confirm(`确定${cake.status === "DISCONTINUED" ? "上架" : "下架"}「${cake.name}」？`)) return;
    try { await deleteCake(cake.id); load(); } catch { setSnack({ msg: "操作失败", severity: "error" }); }
  };

  const filtered = search ? cakes.filter((c) => c.name.includes(search) || (c.nameEn || "").toLowerCase().includes(search.toLowerCase())) : cakes;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, gap: 1 }}>
        <TextField placeholder="搜索..." value={search} onChange={(e) => setSearch(e.target.value)} size="small" sx={{ flex: 1, maxWidth: 300 }} />
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => { setEdit(null); setDialog(true); }} sx={{ bgcolor: "#3C2415" }}>添加</Button>
      </Box>
      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4, color: "#C8A45C" }} /> : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead><TableRow><TableCell>名称</TableCell><TableCell>模式</TableCell><TableCell>价格</TableCell><TableCell>库存</TableCell><TableCell>状态</TableCell><TableCell>操作</TableCell></TableRow></TableHead>
            <TableBody>
              {filtered.map((cake) => {
                const low = cake.stockMode === "GRAB" && cake.stockQty <= cake.lowStockThreshold;
                return (
                  <TableRow key={cake.id} sx={low ? { bgcolor: "rgba(245,166,35,0.08)" } : {}}>
                    <TableCell>{cake.name}{low && <Chip label="低库存" size="small" sx={{ ml: 1, height: 18, fontSize: 10, bgcolor: "warning.main", color: "#FFF" }} />}</TableCell>
                    <TableCell><Chip label={cake.stockMode === "GRAB" ? "即买即取" : "预约"} size="small" color={cake.stockMode === "GRAB" ? "success" : "primary"} /></TableCell>
                    <TableCell>¥{cake.prices?.join(", ") || "?"}</TableCell>
                    <TableCell>{cake.stockMode === "GRAB" ? cake.stockQty : "-"}</TableCell>
                    <TableCell>{cake.status === "ACTIVE" ? "✅" : "❌"}</TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setEdit(cake); setDialog(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(cake)}>
                        {cake.status === "DISCONTINUED" ? <RestoreIcon fontSize="small" color="success" /> : <RemoveCircleIcon fontSize="small" color="warning" />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <CakeFormDialog open={dialog} cake={edit} onClose={() => setDialog(false)} onSaved={() => { setDialog(false); load(); setSnack({ msg: "已保存", severity: "success" }); }} />
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>{snack ? <Alert severity={snack.severity}>{snack.msg}</Alert> : undefined}</Snackbar>
    </Box>
  );
}

function ReservationTab() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(""); const [end, setEnd] = useState(""); const [status, setStatus] = useState("");
  const [statusDialog, setStatusDialog] = useState<{ id: string; newStatus: string } | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setReservations(await fetchAdminReservations()); } catch { setSnack({ msg: "加载失败", severity: "error" }); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const confirmStatus = async () => {
    if (!statusDialog) return;
    try { await updateReservationStatus(statusDialog.id, statusDialog.newStatus); load(); setSnack({ msg: "已更新", severity: "success" }); } catch { setSnack({ msg: "更新失败", severity: "error" }); }
    setStatusDialog(null);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        <TextField type="date" size="small" label="开始" value={start} onChange={(e) => setStart(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField type="date" size="small" label="结束" value={end} onChange={(e) => setEnd(e.target.value)} InputLabelProps={{ shrink: true }} />
        <FormControl size="small" sx={{ minWidth: 100 }}><InputLabel>状态</InputLabel>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} label="状态"><MenuItem value="">全部</MenuItem>{Object.entries(STATUS_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}</Select>
        </FormControl>
        <Button size="small" variant="outlined" onClick={load}>刷新</Button>
      </Box>
      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4, color: "#C8A45C" }} /> : (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow><TableCell>客人</TableCell><TableCell>手机号</TableCell><TableCell>蛋糕</TableCell><TableCell>取货</TableCell><TableCell>状态</TableCell><TableCell>操作</TableCell></TableRow></TableHead>
          <TableBody>{reservations.map((r) => (
            <TableRow key={r.id} sx={r.isAiCustom ? { bgcolor: "rgba(180,130,220,0.04)" } : undefined}><TableCell>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {r.guestName}
                {r.isAiCustom && <Chip label="AI" size="small" sx={{ height: 18, fontSize: 10, bgcolor: "rgba(180,130,220,0.15)", color: "#B482DC", fontFamily: "Georgia, serif" }} />}
              </Box>
              {r.aiPrompt && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontStyle: "italic" }}>
                  💬 {r.aiPrompt}
                </Typography>
              )}
              {r.aiImageUrl && (
                <CardMedia component="img" image={r.aiImageUrl} alt="AI" sx={{ width: 48, height: 48, borderRadius: 1, mt: 0.5, cursor: "pointer", objectFit: "cover" }}
                  onClick={() => window.open(r.aiImageUrl, "_blank")} />
              )}
            </TableCell><TableCell><Typography fontWeight={600}>{r.guestPhone}</Typography></TableCell>
              <TableCell>{r.cakeName}{r.size && <Typography variant="caption"> ({r.size})</Typography>}</TableCell>
              <TableCell>{new Date(r.pickupTime).toLocaleString("zh-CN")}</TableCell>
              <TableCell><Chip label={STATUS_LABELS[r.status]?.label} size="small" color={STATUS_LABELS[r.status]?.color} /></TableCell>
              <TableCell><FormControl size="small" sx={{ minWidth: 100 }}><Select value={r.status} onChange={(e) => setStatusDialog({ id: r.id, newStatus: e.target.value })} size="small">
                {Object.entries(STATUS_LABELS).map(([key, { label }]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}</Select></FormControl></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)}><DialogTitle>确认变更</DialogTitle><DialogContent>确定将状态改为「{STATUS_LABELS[statusDialog?.newStatus || ""]?.label}」？</DialogContent>
        <DialogActions><Button onClick={() => setStatusDialog(null)}>取消</Button><Button onClick={confirmStatus} variant="contained" sx={{ bgcolor: "#3C2415" }}>确认</Button></DialogActions></Dialog>
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>{snack ? <Alert severity={snack.severity}>{snack.msg}</Alert> : undefined}</Snackbar>
    </Box>
  );
}

function UserTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: "success" | "error" } | null>(null);

  const load = useCallback(async () => { setLoading(true); try { setUsers(await fetchUsers()); } catch { setSnack({ msg: "加载失败", severity: "error" }); } setLoading(false); }, []);
  useEffect(() => { load(); }, [load]);

  const handleDelete = async (u: any) => {
    if (!window.confirm(`确定删除用户「${u.username}」？`)) return;
    try { await deleteUser(u.id); load(); setSnack({ msg: "已删除", severity: "success" }); } catch (e: any) { setSnack({ msg: e?.response?.data?.message || "删除失败", severity: "error" }); }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="subtitle1">共 {users.length} 个用户</Typography>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => { setEditUser(null); setDialog(true); }} sx={{ bgcolor: "#3C2415" }}>添加用户</Button>
      </Box>
      {loading ? <CircularProgress sx={{ display: "block", mx: "auto", mt: 4, color: "#C8A45C" }} /> : (
        <TableContainer component={Paper}><Table size="small">
          <TableHead><TableRow><TableCell>用户名</TableCell><TableCell>角色</TableCell><TableCell>创建时间</TableCell><TableCell>操作</TableCell></TableRow></TableHead>
          <TableBody>{users.map((u) => (
            <TableRow key={u.id}><TableCell>{u.username}</TableCell><TableCell><Chip label={u.role} size="small" color={u.role === "ADMIN" ? "primary" : "default"} /></TableCell>
              <TableCell>{new Date(u.createdAt).toLocaleDateString("zh-CN")}</TableCell>
              <TableCell>
                <IconButton size="small" onClick={() => { setEditUser(u); setDialog(true); }}><EditIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(u)}><DeleteIcon fontSize="small" color="error" /></IconButton>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table></TableContainer>
      )}
      <UserFormDialog open={dialog} user={editUser} onClose={() => setDialog(false)} onSaved={() => { setDialog(false); load(); setSnack({ msg: "已保存", severity: "success" }); }} />
      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>{snack ? <Alert severity={snack.severity}>{snack.msg}</Alert> : undefined}</Snackbar>
    </Box>
  );
}

function UserFormDialog({ open, user, onClose, onSaved }: { open: boolean; user: any; onClose: () => void; onSaved: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STAFF");

  useEffect(() => {
    if (user) { setUsername(user.username); setRole(user.role); setPassword(""); }
    else { setUsername(""); setRole("STAFF"); setPassword(""); }
  }, [user, open]);

  const handleSave = async () => {
    try {
      if (user) await updateUser(user.id, { role, ...(password ? { password } : {}) });
      else await createUser({ username, password, role });
      onSaved();
    } catch (e: any) { /* error handled by parent */ }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{user ? "编辑用户" : "添加用户"}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="用户名" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth required disabled={!!user} />
          <TextField label={user ? "新密码（留空不修改）" : "密码"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth required={!user} />
          <FormControl fullWidth><InputLabel>角色</InputLabel>
            <Select value={role} onChange={(e) => setRole(e.target.value)} label="角色">
              <MenuItem value="ADMIN">ADMIN - 管理员</MenuItem>
              <MenuItem value="STAFF">STAFF - 员工</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>取消</Button><Button onClick={handleSave} variant="contained" sx={{ bgcolor: "#3C2415" }}>保存</Button></DialogActions>
    </Dialog>
  );
}

// CakeFormDialog (same as before, omitted for brevity — kept from previous version)
function CakeFormDialog({ open, cake, onClose, onSaved }: { open: boolean; cake: Cake | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(""); const [category, setCategory] = useState("whole_mousse"); const [stockMode, setStockMode] = useState("PREORDER");
  const [price, setPrice] = useState(""); const [sizes, setSizes] = useState("6寸,8寸,10寸"); const [description, setDescription] = useState("");
  const [stockQty, setStockQty] = useState(0); const [imageUrl, setImageUrl] = useState(""); const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (cake) { setName(cake.name); setCategory(cake.category); setStockMode(cake.stockMode); setPrice(cake.prices?.join(",") || ""); setSizes(cake.sizes?.join(",") || "6寸"); setDescription(cake.description || ""); setStockQty(cake.stockQty); setImageUrl(cake.imageUrls?.[0] || ""); }
    else { setName(""); setCategory("whole_mousse"); setStockMode("PREORDER"); setPrice(""); setSizes("6寸,8寸,10寸"); setDescription(""); setStockQty(0); setImageUrl(""); }
  }, [cake, open]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setUploading(true);
    const form = new FormData(); form.append("file", file);
    try { const res = await fetch(`${API_BASE}/admin/upload`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` }, body: form }); const data = await res.json(); if (data.code === 0) setImageUrl(data.data.url); } catch {}
    setUploading(false);
  };

  const handleSave = async () => {
    const pa = price.split(",").map((s: string) => s.trim()).filter(Boolean);
    const sa = sizes.split(",").map((s: string) => s.trim()).filter(Boolean);
    const data = { name, category, stockMode, prices: pa.length ? pa : ["0"], sizes: sa.length ? sa : ["6寸"], description, stockQty: stockMode === "GRAB" ? stockQty : 0, imageUrls: imageUrl ? [imageUrl] : [], leadTimeHours: stockMode === "PREORDER" ? 24 : 0, tags: [] };
    try { if (cake) await updateCake(cake.id, data); else await createCake(data); onSaved(); } catch {}
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>{cake ? "编辑蛋糕" : "添加蛋糕"}</DialogTitle>
      <DialogContent><Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
        <TextField label="名称" value={name} onChange={(e) => setName(e.target.value)} fullWidth required />
        <FormControl fullWidth><InputLabel>分类</InputLabel><Select value={category} onChange={(e) => setCategory(e.target.value)} label="分类">
          {["whole_mousse","whole_cheese","whole_cream","whole_chocolate","mini_slice","mini_tart","mini_mousse","mini_cheese","mini_cream"].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
        <FormControl fullWidth><InputLabel>库存模式</InputLabel><Select value={stockMode} onChange={(e) => setStockMode(e.target.value)} label="库存模式"><MenuItem value="GRAB">🟢 即买即取</MenuItem><MenuItem value="PREORDER">🔵 提前预约</MenuItem></Select></FormControl>
        <TextField label="尺寸（逗号分隔）" value={sizes} onChange={(e) => setSizes(e.target.value)} fullWidth helperText="如: 6寸,8寸,10寸" />
        <TextField label="价格（逗号分隔）" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth helperText="如: 288,388,588" />
        {stockMode === "GRAB" && <TextField label="库存数量" value={stockQty} onChange={(e) => setStockQty(parseInt(e.target.value) || 0)} fullWidth type="number" />}
        <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}><TextField label="图片URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} fullWidth /><Button variant="outlined" component="label" disabled={uploading} size="small" sx={{ whiteSpace: "nowrap" }}>{uploading ? "上传中..." : "上传"}<input type="file" hidden accept="image/*" onChange={handleUpload} /></Button></Box>
        {imageUrl && <CardMedia component="img" image={imageUrl} sx={{ height: 120, borderRadius: 2, objectFit: "cover", bgcolor: "#F5F0E8" }} />}
        <TextField label="描述" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={2} />
      </Box></DialogContent>
      <DialogActions><Button onClick={onClose}>取消</Button><Button onClick={handleSave} variant="contained" sx={{ bgcolor: "#3C2415" }}>保存</Button></DialogActions>
    </Dialog>
  );
}
