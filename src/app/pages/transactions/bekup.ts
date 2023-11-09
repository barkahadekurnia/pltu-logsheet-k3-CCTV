 //   if (recordAttachments.length > 1) {
    //     this.syncJob.order.recordAttachments.message += `(${recordAttachments.length})`;
    //   }

    //   const attachmentBySchedule: any = {};

    //   Object.entries(groupBy(recordAttachments, 'scheduleTrxId'))
    //     .forEach(([scheduleTrxId, attachments]) => {
    //       console.log('attachments cek1', attachments)
    //       attachmentBySchedule[scheduleTrxId] = {
    //         attachmentIds: attachments
    //           .map(attachment => attachment.recordAttachmentId),
    //         uploadedAttachmentIds: [],
    //       };
    //     });

    //   subscriber.next({
    //     complexMessage: Object.values(this.syncJob.order)
    //   });
    //   console.log('recordAttachmentId', recordAttachments.entries())

    //   for (const [i, item] of recordAttachments.entries()) {
    //     const { recordAttachmentId, ...data } = item;

    //     const leftover = recordAttachments.length - (i + 1);
    //     // console.log('recordAttachments.length :', recordAttachments.length)
    //     // console.log('i :', i)
    //     // console.log({ uploadRecordAttachment: JSON.stringify(data) });
    //     console.log('data upload', data)
    //     console.log('data upload item', item)
    //     console.log('data upload recordAttachmentId', recordAttachmentId)

    //     // const bodyObj = new FormData();

    //     // bodyObj.append('attachment[]', await this.media.convertFileToBlob(data.filePath));
    //     // const respUploadReplace = await this.http.postFormData('', bodyObj);

    //     // if (![200, 201].includes(respUploadReplace!.status)) {
    //     //   throw respUploadReplace;
    //     // }

    //     // console.log('resupload', respUploadReplace)

    //     await this.http.requests({
          
    //       requests: [() => this.http.uploadRecordAttachment(data)],
    //       onSuccess: ([response]) => {
    //         if (response.status >= 400) {
    //           throw response;
    //         }
    //         console.log('recordAttachmentId', response)
    //         uploaded.push(recordAttachmentId);

    //         attachmentBySchedule[item.scheduleTrxId].uploadedAttachmentIds
    //           .push(recordAttachmentId);

    //         activityLogs.push({
    //           scheduleTrxId: item.scheduleTrxId,
    //           status: 'success',
    //           message: `berhasil upload file attachment`,
    //         });
    //       },
    //       onError: (error) => {
    //         console.log(error)
    //         activityLogs.push({
    //           scheduleTrxId: item.scheduleTrxId,
    //           status: 'failed',
    //           message: error?.data
    //             ? this.http.getErrorMessage(error.data)
    //             : this.http.getErrorMessage(error)
    //         });
    //       },
    //       onComplete: () => {
    //         if (leftover) {
    //           this.syncJob.order.recordAttachments.message = 'Upload file attachments...';

    //           if (leftover > 1) {
    //             this.syncJob.order.recordAttachments.message += ` (${leftover})`;
    //           }

    //           subscriber.next({
    //             complexMessage: Object.values(this.syncJob.order)
    //           });
    //         } else {
    //           const uploadedBySchedule = Object.entries<any>(attachmentBySchedule)
    //             .filter(([key, value]) =>
    //               value.attachmentIds?.length === value.uploadedAttachmentIds?.length
    //             )
    //             .map(([scheduleTrxId]) => scheduleTrxId);
    //           console.log('uploadedBySchedule ', uploadedBySchedule);

    //           if (uploadedBySchedule.length) {
    //             const marks = this.database.marks(uploadedBySchedule.length);
    //             // console.log('marks', marks);

    //             const where = {
    //               query: `trxId IN (${marks})`,
    //               params: uploadedBySchedule
    //             };
    //             console.log(where)
    //             this.database.update('recordAttachment', { isUploaded: 1 }, where);
    //           }

    //           if (uploaded.length === recordAttachments.length) {
    //             this.syncJob.order.recordAttachments.status = 'success';
    //             this.syncJob.order.recordAttachments.message = 'Berhasil upload file attachment';

    //             if (uploaded.length > 1) {
    //               this.syncJob.order.recordAttachments.message += `s (${uploaded.length})`;
    //             }
    //           } else {
    //             const failureCount = recordAttachments.length - uploaded.length;
    //             this.syncJob.order.recordAttachments.status = 'failed';
    //             this.syncJob.order.recordAttachments.message = 'Gagal upload file attachment';

    //             if (failureCount > 0) {
    //               this.syncJob.order.recordAttachments.message += ` (${failureCount})`;
    //             }
    //           }

    //           this.shared.addLogActivity({
    //             activity: 'User upload file attachments ke server',
    //             data: activityLogs
    //           });

    //           this.onProcessFinished(subscriber, loader);
    //         }
    //       },
    //     });
    //   }
    // } else {
    //   delete this.syncJob.order.recordAttachments;

    //   subscriber.next({
    //     complexMessage: Object.values(this.syncJob.order)
    //   });
    // }
    // }
  