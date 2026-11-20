import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import Notification, {
  INotification,
  NotificationType,
  RelatedEntityType,
} from "@/models/Notification";
import EquipmentCheckout from "@/models/EquipmentCheckout";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { NotificationQueryInput } from "@/lib/validations/notification";

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: RelatedEntityType;
  relatedEntityId?: string | mongoose.Types.ObjectId;
  link?: string;
  idempotencyKey?: string;
}

/**
 * Creates a notification for a user with idempotency protection.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<INotification> {
  await connectToDatabase();

  const userObjId = new mongoose.Types.ObjectId(params.userId.toString());
  const relatedObjId = params.relatedEntityId
    ? new mongoose.Types.ObjectId(params.relatedEntityId.toString())
    : undefined;

  // Idempotency check: if key provided, check if already exists
  if (params.idempotencyKey) {
    const existing = await Notification.findOne({
      idempotencyKey: params.idempotencyKey,
    });
    if (existing) {
      return existing;
    }
  }

  try {
    const doc = await Notification.create({
      user: userObjId,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: relatedObjId,
      link: params.link?.trim(),
      idempotencyKey: params.idempotencyKey,
      isRead: false,
    });
    return doc;
  } catch (err: unknown) {
    // If concurrent insert created the same idempotency key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((err as any)?.code === 11000 && params.idempotencyKey) {
      const existing = await Notification.findOne({
        idempotencyKey: params.idempotencyKey,
      });
      if (existing) {
        return existing;
      }
    }
    throw err;
  }
}

/**
 * Retrieves paginated notifications belonging exclusively to the authenticated user.
 */
export async function getUserNotifications(
  userId: string,
  params: NotificationQueryInput
) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const userObjId = new mongoose.Types.ObjectId(userId);
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = { user: userObjId };
  if (params.unreadOnly) {
    query.isRead = false;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<INotification[]>(),
    Notification.countDocuments(query),
    Notification.countDocuments({ user: userObjId, isRead: false }),
  ]);

  return {
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
    unreadCount,
  };
}

/**
 * Returns the unread notification count for an authenticated user.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  return await Notification.countDocuments({
    user: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
}

/**
 * Marks a specific notification as read, enforcing user ownership.
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<INotification> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error("INVALID_NOTIFICATION_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  // Ownership check
  if (notification.user.toString() !== userId.toString()) {
    throw new Error("FORBIDDEN");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
}

/**
 * Marks all notifications belonging to the user as read.
 */
export async function markAllNotificationsAsRead(userId: string) {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const result = await Notification.updateMany(
    {
      user: new mongoose.Types.ObjectId(userId),
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  return { modifiedCount: result.modifiedCount };
}

/**
 * Deletes a notification, ensuring the caller is the owner.
 */
export async function deleteNotification(
  notificationId: string,
  userId: string
): Promise<boolean> {
  await connectToDatabase();

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new Error("INVALID_NOTIFICATION_ID");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new Error("NOTIFICATION_NOT_FOUND");
  }

  // Ownership check
  if (notification.user.toString() !== userId.toString()) {
    throw new Error("FORBIDDEN");
  }

  await Notification.findByIdAndDelete(notificationId);
  return true;
}

// ---------------------------------------------------------------------------
// Business Event Integration Helpers
// ---------------------------------------------------------------------------

export async function notifyBookingConfirmed(booking: {
  _id: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  startTime?: string;
  endTime?: string;
  bookingDate?: Date | string;
}) {
  try {
    const bookingId = booking._id.toString();
    const userId = booking.user.toString();
    await createNotification({
      userId,
      title: "Booking Confirmed! ⚡",
      message: `Your court reservation for ${booking.startTime || "the requested slot"} has been successfully confirmed.`,
      type: "BOOKING_CONFIRMED",
      relatedEntityType: "BOOKING",
      relatedEntityId: bookingId,
      link: "/bookings",
      idempotencyKey: `booking-confirmed-${bookingId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch booking confirmed notification:", err);
  }
}

export async function notifyBookingCancelled(
  booking: {
    _id: mongoose.Types.ObjectId | string;
    user: mongoose.Types.ObjectId | string;
  },
  reason?: string
) {
  try {
    const bookingId = booking._id.toString();
    const userId = booking.user.toString();
    await createNotification({
      userId,
      title: "Booking Cancelled ✕",
      message: `Your court reservation has been cancelled. ${
        reason ? `Reason: "${reason}"` : ""
      }`.trim(),
      type: "BOOKING_CANCELLED",
      relatedEntityType: "BOOKING",
      relatedEntityId: bookingId,
      link: "/bookings",
      idempotencyKey: `booking-cancelled-${bookingId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch booking cancelled notification:", err);
  }
}

export async function notifyBookingRejected(
  booking: {
    _id: mongoose.Types.ObjectId | string;
    user: mongoose.Types.ObjectId | string;
  },
  reason?: string
) {
  try {
    const bookingId = booking._id.toString();
    const userId = booking.user.toString();
    await createNotification({
      userId,
      title: "Booking Request Rejected",
      message: `Your pending booking request was rejected. ${
        reason ? `Reason: "${reason}"` : ""
      }`.trim(),
      type: "BOOKING_REJECTED",
      relatedEntityType: "BOOKING",
      relatedEntityId: bookingId,
      link: "/bookings",
      idempotencyKey: `booking-rejected-${bookingId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch booking rejected notification:", err);
  }
}

export async function notifyBookingCompleted(booking: {
  _id: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
}) {
  try {
    const bookingId = booking._id.toString();
    const userId = booking.user.toString();
    await createNotification({
      userId,
      title: "Session Completed ✓",
      message: "Your court booking session has completed. Thank you for playing at Courts After Dark!",
      type: "BOOKING_COMPLETED",
      relatedEntityType: "BOOKING",
      relatedEntityId: bookingId,
      link: "/bookings",
      idempotencyKey: `booking-completed-${bookingId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch booking completed notification:", err);
  }
}

export async function notifyWaitlistJoined(waitlist: {
  _id: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  position?: number;
}) {
  try {
    const waitlistId = waitlist._id.toString();
    const userId = waitlist.user.toString();
    await createNotification({
      userId,
      title: "Joined Waitlist ⏳",
      message: `You have joined the court waiting list at position #${
        waitlist.position || 1
      }. We will automatically promote you if a slot opens up!`,
      type: "WAITLIST_JOINED",
      relatedEntityType: "WAITLIST",
      relatedEntityId: waitlistId,
      link: "/bookings",
      idempotencyKey: `waitlist-joined-${waitlistId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch waitlist joined notification:", err);
  }
}

export async function notifyWaitlistPromoted(
  bookingId: string,
  promotedUserId: string
) {
  try {
    await createNotification({
      userId: promotedUserId,
      title: "Court Slot Available! You've Been Promoted 🎉",
      message: "A court reservation opened up and your waitlist request has been automatically promoted to CONFIRMED!",
      type: "WAITLIST_PROMOTED",
      relatedEntityType: "BOOKING",
      relatedEntityId: bookingId,
      link: "/bookings",
      idempotencyKey: `waitlist-promoted-${bookingId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch waitlist promoted notification:", err);
  }
}

export async function notifyEquipmentIssued(checkout: {
  _id: mongoose.Types.ObjectId | string;
  user: mongoose.Types.ObjectId | string;
  expectedReturnAt?: Date | string | null;
}) {
  try {
    const checkoutId = checkout._id.toString();
    const userId = checkout.user.toString();
    const returnTimeStr = checkout.expectedReturnAt
      ? new Date(checkout.expectedReturnAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "the end of your session";

    await createNotification({
      userId,
      title: "Sports Equipment Issued 🏸",
      message: `Your equipment has been checked out by the manager. Expected return time is ${returnTimeStr}.`,
      type: "EQUIPMENT_ISSUED",
      relatedEntityType: "EQUIPMENT_CHECKOUT",
      relatedEntityId: checkoutId,
      link: "/equipment",
      idempotencyKey: `equipment-issued-${checkoutId}`,
    });
  } catch (err) {
    console.error("Failed to dispatch equipment issued notification:", err);
  }
}

export async function notifyMaintenanceScheduled(maintenance: {
  _id: mongoose.Types.ObjectId | string;
  facility: mongoose.Types.ObjectId | string;
  startAt: Date;
  endAt: Date;
  reason: string;
}) {
  try {
    const maintId = maintenance._id.toString();
    const facilityId = maintenance.facility.toString();

    // 1. Notify Administrators
    const admins = await User.find({ role: "ADMIN" }).select("_id").lean();
    for (const a of admins) {
      await createNotification({
        userId: a._id.toString(),
        title: "Maintenance Scheduled 🔧",
        message: `Maintenance scheduled on campus facility from ${maintenance.startAt.toLocaleDateString()} for reason: "${maintenance.reason}".`,
        type: "MAINTENANCE_SCHEDULED",
        relatedEntityType: "MAINTENANCE",
        relatedEntityId: maintId,
        link: "/admin/maintenance",
        idempotencyKey: `maint-admin-${maintId}-${a._id}`,
      });
    }

    // 2. Notify students who have confirmed bookings during or adjacent to that window
    const overlappingBookings = await Booking.find({
      facility: new mongoose.Types.ObjectId(facilityId),
      status: "CONFIRMED",
      startAt: { $lt: maintenance.endAt },
      endAt: { $gt: maintenance.startAt },
    })
      .select("user")
      .lean();

    for (const b of overlappingBookings) {
      await createNotification({
        userId: b.user.toString(),
        title: "Facility Maintenance Notice ⚠️",
        message: `Please note that maintenance is scheduled at your booked facility: "${maintenance.reason}". Please review your booking schedule.`,
        type: "MAINTENANCE_SCHEDULED",
        relatedEntityType: "BOOKING",
        relatedEntityId: b._id.toString(),
        link: "/bookings",
        idempotencyKey: `maint-user-${maintId}-${b.user}`,
      });
    }
  } catch (err) {
    console.error("Failed to dispatch maintenance notifications:", err);
  }
}

// ---------------------------------------------------------------------------
// Scheduled / Cron Reminder Engine (Idempotent)
// ---------------------------------------------------------------------------

export async function processEquipmentReminders() {
  await connectToDatabase();
  const now = new Date();
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  let remindersSent = 0;
  let overdueSent = 0;

  // 1. Return reminders: Checkouts status === ISSUED, now <= expectedReturnAt <= now + 2h
  const upcomingReturns = await EquipmentCheckout.find({
    status: "ISSUED",
    expectedReturnAt: { $gte: now, $lte: twoHoursFromNow },
  }).lean();

  for (const c of upcomingReturns) {
    const hourKey = new Date(c.expectedReturnAt).toISOString().slice(0, 13);
    const key = `return-reminder-${c._id}-${hourKey}`;
    try {
      const created = await createNotification({
        userId: c.user.toString(),
        title: "Equipment Return Reminder ⏱️",
        message: `Reminder: Your borrowed sports equipment is due for return by ${new Date(
          c.expectedReturnAt
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.`,
        type: "EQUIPMENT_RETURN_REMINDER",
        relatedEntityType: "EQUIPMENT_CHECKOUT",
        relatedEntityId: c._id.toString(),
        link: "/equipment",
        idempotencyKey: key,
      });
      if (created.createdAt.getTime() >= now.getTime() - 5000) {
        remindersSent++;
      }
    } catch {
      // Idempotent catch
    }
  }

  // 2. Overdue notifications: Checkouts status === ISSUED, expectedReturnAt < now
  const overdueCheckouts = await EquipmentCheckout.find({
    status: "ISSUED",
    expectedReturnAt: { $lt: now },
  }).lean();

  const todayKey = now.toISOString().slice(0, 10);
  for (const c of overdueCheckouts) {
    const key = `overdue-${c._id}-${todayKey}`;
    try {
      const created = await createNotification({
        userId: c.user.toString(),
        title: "Equipment Overdue ⚠️",
        message: "Your borrowed sports equipment is past its expected return time. Please return items immediately to avoid account restrictions.",
        type: "EQUIPMENT_OVERDUE",
        relatedEntityType: "EQUIPMENT_CHECKOUT",
        relatedEntityId: c._id.toString(),
        link: "/equipment",
        idempotencyKey: key,
      });
      if (created.createdAt.getTime() >= now.getTime() - 5000) {
        overdueSent++;
      }
    } catch {
      // Idempotent catch
    }
  }

  return { remindersSent, overdueSent, processedAt: now.toISOString() };
}

