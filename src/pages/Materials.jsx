import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";
import api from "../services/api";

export default function Materials() {
  const [groups, setGroups] = useState([]);
  const [materials, setMaterials] = useState([]);

  // Group form
  const [groupName, setGroupName] = useState("");
  const [groupCode, setGroupCode] = useState("");
  const [groupDesc, setGroupDesc] = useState("");

  // Material form
  const [matName, setMatName] = useState("");
  const [matNum, setMatNum] = useState("");
  const [matUom, setMatUom] = useState("");
  const [matDesc, setMatDesc] = useState("");
  const [matGroup, setMatGroup] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const g = await api.get("/materials/groups");
    const m = await api.get("/materials");
    setGroups(g.data.groups || []);
    setMaterials(m.data.materials || []);
  };

  // Create Group
  const createGroup = async () => {
    if (!groupName || !groupCode) return alert("Fields required");

    try {
      await api.post("/materials/groups", {
        name: groupName,
        code: groupCode,
        description: groupDesc,
      });
      alert("Group created");
      setGroupName("");
      setGroupCode("");
      setGroupDesc("");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  // Create Material
  const createMaterial = async () => {
    if (!matName || !matNum) return alert("Fields required");

    try {
      await api.post("/materials", {
        name: matName,
        materialNumber: matNum,
        uom: matUom,
        description: matDesc,
        materialGroupId: matGroup || null,
      });

      alert("Material created");
      setMatDesc("");
      setMatName("");
      setMatNum("");
      setMatUom("");
      setMatGroup("");

      fetchData();
    } catch (err) {
      console.error(err);
      alert("Failed");
    }
  };

  return (
    <Box p={4}>

      {/* ---------------- GROUP SECTION ---------------- */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5">Create Material Group</Typography>

          <TextField
            label="Group Name"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Group Code"
            fullWidth
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            value={groupDesc}
            onChange={(e) => setGroupDesc(e.target.value)}
            sx={{ mt: 2 }}
          />

          <Button variant="contained" onClick={createGroup} sx={{ mt: 2 }}>
            Create Group
          </Button>
        </CardContent>
      </Card>

      {/* ---------------- MATERIAL SECTION ---------------- */}
      <Card>
        <CardContent>
          <Typography variant="h5">Create Material</Typography>

          <TextField
            label="Material Name"
            fullWidth
            value={matName}
            onChange={(e) => setMatName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Material Number"
            fullWidth
            value={matNum}
            onChange={(e) => setMatNum(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="UOM"
            fullWidth
            value={matUom}
            onChange={(e) => setMatUom(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            value={matDesc}
            onChange={(e) => setMatDesc(e.target.value)}
            sx={{ mt: 2 }}
          />

          <TextField
            select
            label="Material Group"
            fullWidth
            value={matGroup}
            onChange={(e) => setMatGroup(e.target.value)}
            sx={{ mt: 2 }}
          >
            {groups.map((g) => (
              <MenuItem key={g.id} value={g.id}>
                {g.name}
              </MenuItem>
            ))}
          </TextField>

          <Button variant="contained" onClick={createMaterial} sx={{ mt: 2 }}>
            Create Material
          </Button>
        </CardContent>
      </Card>

    </Box>
  );
}
