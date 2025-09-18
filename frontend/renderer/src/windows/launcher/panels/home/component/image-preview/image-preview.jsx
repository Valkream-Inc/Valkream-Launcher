import CloseIcon from "@mui/icons-material/Close";
import {
  Card,
  CardMedia,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import React, { useState } from "react";

export default function ImagePreview(props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Image miniature cliquable */}
      <Card
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        sx={{
          cursor: "pointer",
          "&:hover": { opacity: 0.8 },
          background: "transparent",
        }}
      >
        <CardMedia
          component="img"
          src={props.src}
          alt={props.alt || "image"}
          {...props}
        />
      </Card>

      {/* Aperçu plein écran */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <IconButton
          onClick={() => setOpen(false)}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "white",
            background: "rgba(0,0,0,0.5)",
            "&:hover": { background: "rgba(0,0,0,0.7)" },
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent
          sx={{
            backgroundColor: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 0,
          }}
        >
          <img
            src={props.src}
            alt={props.alt || "image"}
            style={{
              maxHeight: "90vh",
              maxWidth: "90vw",
              objectFit: "contain",
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
