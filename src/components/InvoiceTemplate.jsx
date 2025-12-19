import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Invoice Template Component
 * Matches the clean, modern invoice design format
 */
export default function InvoiceTemplate({ invoice, dealer, company }) {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Calculate totals
  const items = invoice.items || invoice.lineItems || [];
  const subtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity || item.qty || 1);
    const price = Number(item.price || item.unitPrice || 0);
    return sum + qty * price;
  }, 0);
  const tax = Number(invoice.taxAmount || invoice.tax || 0);
  const discount = Number(invoice.discountAmount || invoice.discount || 0);
  const grandTotal = Number(invoice.totalAmount || invoice.amount || subtotal + tax - discount);

  return (
    <Box
      sx={{
        maxWidth: "210mm", // A4 width
        margin: "0 auto",
        padding: "var(--spacing-8)",
        background: "var(--color-surface)",
        fontFamily: "var(--font-family)",
        color: "var(--color-text-primary)",
        "@media print": {
          padding: "var(--spacing-6)",
          maxWidth: "100%",
        },
      }}
    >
      {/* Header with INVOICE title and decorative shape */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--spacing-8)",
          position: "relative",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontSize: "var(--font-size-4xl)",
            fontWeight: "var(--font-weight-bold)",
            color: "var(--color-text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          INVOICE
        </Typography>
        {/* Decorative shape - using primary color */}
        <Box
          sx={{
            width: "120px",
            height: "120px",
            background: "var(--color-primary-soft)",
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            opacity: 0.3,
            position: "absolute",
            top: "-20px",
            right: "-40px",
            "@media print": {
              display: "none",
            },
          }}
        />
      </Box>

      {/* Information Blocks */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--spacing-8)",
          marginBottom: "var(--spacing-8)",
        }}
      >
        {/* Left Block: Date Issued, Invoice No */}
        <Box>
          <Box sx={{ marginBottom: "var(--spacing-4)" }}>
            <Typography
              sx={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-secondary)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              Date Issued:
            </Typography>
            <Typography
              sx={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatDate(invoice.invoiceDate || invoice.dateIssued || invoice.createdAt)}
            </Typography>
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "var(--font-size-sm)",
                fontWeight: "var(--font-weight-medium)",
                color: "var(--color-text-secondary)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              Invoice No:
            </Typography>
            <Typography
              sx={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-primary)",
              }}
            >
              {invoice.invoiceNumber || invoice.invoiceNo || `INV-${invoice.id?.slice(0, 8) || "N/A"}`}
            </Typography>
          </Box>
        </Box>

        {/* Right Block: Issued to */}
        <Box>
          <Typography
            sx={{
              fontSize: "var(--font-size-sm)",
              fontWeight: "var(--font-weight-medium)",
              color: "var(--color-text-secondary)",
              marginBottom: "var(--spacing-1)",
            }}
          >
            Issued to:
          </Typography>
          <Typography
            sx={{
              fontSize: "var(--font-size-base)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--line-height-relaxed)",
            }}
          >
            {dealer?.businessName || dealer?.name || invoice.dealerName || "N/A"}
            <br />
            {dealer?.address || invoice.dealerAddress || ""}
            {dealer?.address && <br />}
            {dealer?.city && `${dealer.city}, `}
            {dealer?.state && `${dealer.state} `}
            {dealer?.pincode && dealer.pincode}
            {invoice.dealerCode && (
              <>
                <br />
                Code: {invoice.dealerCode}
              </>
            )}
          </Typography>
        </Box>
      </Box>

      {/* Items Table */}
      <Box
        sx={{
          marginBottom: "var(--spacing-6)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                background: "var(--color-background)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <th
                style={{
                  padding: "var(--spacing-3) var(--spacing-4)",
                  textAlign: "left",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                NO
              </th>
              <th
                style={{
                  padding: "var(--spacing-3) var(--spacing-4)",
                  textAlign: "left",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                DESCRIPTION
              </th>
              <th
                style={{
                  padding: "var(--spacing-3) var(--spacing-4)",
                  textAlign: "center",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                QTY
              </th>
              <th
                style={{
                  padding: "var(--spacing-3) var(--spacing-4)",
                  textAlign: "right",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                PRICE
              </th>
              <th
                style={{
                  padding: "var(--spacing-3) var(--spacing-4)",
                  textAlign: "right",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "var(--font-weight-semibold)",
                  color: "var(--color-text-primary)",
                }}
              >
                SUBTOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item, index) => {
                const qty = Number(item.quantity || item.qty || 1);
                const price = Number(item.price || item.unitPrice || 0);
                const itemSubtotal = qty * price;
                return (
                  <tr
                    key={item.id || index}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <td
                      style={{
                        padding: "var(--spacing-3) var(--spacing-4)",
                        fontSize: "var(--font-size-base)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3) var(--spacing-4)",
                        fontSize: "var(--font-size-base)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {item.description || item.name || item.productName || "Item"}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3) var(--spacing-4)",
                        textAlign: "center",
                        fontSize: "var(--font-size-base)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {qty}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3) var(--spacing-4)",
                        textAlign: "right",
                        fontSize: "var(--font-size-base)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {formatCurrency(price)}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-3) var(--spacing-4)",
                        textAlign: "right",
                        fontSize: "var(--font-size-base)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {formatCurrency(itemSubtotal)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: "var(--spacing-4)",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Box>

      {/* Grand Total */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "var(--spacing-8)",
        }}
      >
        <Box sx={{ textAlign: "right", minWidth: "200px" }}>
          {subtotal !== grandTotal && (
            <>
              <Box sx={{ marginBottom: "var(--spacing-2)" }}>
                <Typography
                  sx={{
                    fontSize: "var(--font-size-sm)",
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--spacing-1)",
                  }}
                >
                  Subtotal:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "var(--font-size-base)",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {formatCurrency(subtotal)}
                </Typography>
              </Box>
              {discount > 0 && (
                <Box sx={{ marginBottom: "var(--spacing-2)" }}>
                  <Typography
                    sx={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-secondary)",
                      marginBottom: "var(--spacing-1)",
                    }}
                  >
                    Discount:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "var(--font-size-base)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    -{formatCurrency(discount)}
                  </Typography>
                </Box>
              )}
              {tax > 0 && (
                <Box sx={{ marginBottom: "var(--spacing-2)" }}>
                  <Typography
                    sx={{
                      fontSize: "var(--font-size-sm)",
                      color: "var(--color-text-secondary)",
                      marginBottom: "var(--spacing-1)",
                    }}
                  >
                    Tax:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "var(--font-size-base)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {formatCurrency(tax)}
                  </Typography>
                </Box>
              )}
            </>
          )}
          <Box>
            <Typography
              sx={{
                fontSize: "var(--font-size-lg)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-primary)",
                marginBottom: "var(--spacing-1)",
              }}
            >
              GRAND TOTAL
            </Typography>
            <Typography
              sx={{
                fontSize: "var(--font-size-xl)",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatCurrency(grandTotal)}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Footer: Note and Signature */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--spacing-8)",
          marginTop: "var(--spacing-12)",
          position: "relative",
        }}
      >
        {/* Left Block: Note */}
        <Box>
          <Typography
            sx={{
              fontSize: "var(--font-size-base)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--color-text-primary)",
              marginBottom: "var(--spacing-2)",
            }}
          >
            Note:
          </Typography>
          <Typography
            sx={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-primary)",
              lineHeight: "var(--line-height-relaxed)",
            }}
          >
            {invoice.note || invoice.notes || (
              <>
                {company?.bankName && (
                  <>
                    Bank Name: {company.bankName}
                    <br />
                  </>
                )}
                {company?.accountNumber && (
                  <>
                    Account No: {company.accountNumber}
                    <br />
                  </>
                )}
                {invoice.paymentTerms && (
                  <>
                    Payment Terms: {invoice.paymentTerms}
                    <br />
                  </>
                )}
                {!company?.bankName && !company?.accountNumber && !invoice.paymentTerms && (
                  <>Thank you for your business.</>
                )}
              </>
            )}
          </Typography>
        </Box>

        {/* Right Block: Signature */}
        <Box sx={{ textAlign: "right" }}>
          <Box
            sx={{
              marginBottom: "var(--spacing-2)",
              minHeight: "60px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: "flex-end",
            }}
          >
            <Typography
              sx={{
                fontSize: "var(--font-size-base)",
                color: "var(--color-text-primary)",
                fontFamily: "cursive, serif",
                marginBottom: "var(--spacing-1)",
              }}
            >
              {company?.signatoryName || invoice.signatoryName || "Authorized Signatory"}
            </Typography>
            <Typography
              sx={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-primary)",
                textDecoration: "underline",
              }}
            >
              {company?.signatoryTitle || invoice.signatoryTitle || "Finance Manager"}
            </Typography>
          </Box>
        </Box>

        {/* Decorative shape at bottom left */}
        <Box
          sx={{
            position: "absolute",
            bottom: "-40px",
            left: "-40px",
            width: "100px",
            height: "100px",
            background: "var(--color-primary-soft)",
            borderRadius: "50%",
            opacity: 0.2,
            "@media print": {
              display: "none",
            },
          }}
        />
      </Box>
    </Box>
  );
}

