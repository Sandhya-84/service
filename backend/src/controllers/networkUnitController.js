import NetworkUnit from "../models/NetworkUnit.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

export const updateNetworkUnits = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    const { units } = req.body;

    // Validate purchase order
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);

    if (!purchaseOrder) {
      return res.status(404).json({
        message: "Purchase order not found",
      });
    }

    // Validate units array
    if (!Array.isArray(units) || units.length === 0) {
      return res.status(400).json({
        message: "Please provide at least one unit to update",
      });
    }

    // Make sure every unit belongs to this purchase order
    const unitIds = units.map((unit) => unit._id);

    const existingUnits = await NetworkUnit.find({
      _id: { $in: unitIds },
      purchaseOrderId,
    });

    if (existingUnits.length !== units.length) {
      return res.status(400).json({
        message: "One or more selected units do not belong to this purchase order",
      });
    }

    // Update each selected unit
    for (const unit of units) {
      const updateData = {};

      if (unit.unitCode !== undefined) {
        updateData.unitCode = String(unit.unitCode).trim();
      }

      if (unit.hostname !== undefined) {
        updateData.hostname = String(unit.hostname).trim();
      }

      if (unit.radioConfiguration !== undefined) {
        updateData.radioConfiguration =
          String(unit.radioConfiguration).trim();
      }

      await NetworkUnit.findOneAndUpdate(
        {
          _id: unit._id,
          purchaseOrderId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    // Get updated units
    const updatedUnits = await NetworkUnit.find({
      purchaseOrderId,
    }).sort({
      createdAt: 1,
    });

    return res.status(200).json({
      message: "Network units updated successfully",
      units: updatedUnits,
    });
  } catch (error) {
    console.error("Update network units error:", error);

    return res.status(500).json({
      message: "Failed to update network units",
      error: error.message,
    });
  }
};