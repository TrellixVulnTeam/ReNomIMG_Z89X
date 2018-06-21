import numpy as np
from renom_img.api.utility.box import calc_iou


def nms(preds, threshold, return_type='box'):
    """
    NMS(Non maximum suppression)

    Args:
        box_list:
        threshold:
        return_type:
    """
    cdef float iou;
    result = []
    for pred in preds:
        boxes = [obj['box'] for obj in pred]
        scores = [obj['score'] for obj in pred]
        class_id = [obj['score'] for obj in pred]
        index = np.argsort(scores).tolist()
        tmp = []
        while len(index) > 0:
            last = len(index) - 1
            i = index[last]
            box1 = boxes[i]
            score = scores[i]

            tmp.append({
                    'box': box1,
                    'score': score
                })
            index.pop(last)

            for j in index:
                box2 = boxes[j]
                iou = calc_iou(box1, box2)
                if iou > threshold:
                    index.remove(j)
        result.append(tmp)
    return result

def soft_nms(preds, threshold, return_type='box'):
    """
    Soft-NMS.

    Reference:
        Navaneeth Bodla, Bharat Singh, Rama Chellappa, Larry S. Davis, 
        Soft-NMS -- Improving Object Detection With One Line of Code
        https://arxiv.org/abs/1704.04503
    """

    cdef float iou;
    result = []
    for pred in preds:
        boxes = [obj['box'] for obj in pred]
        scores = [obj['score'] for obj in pred]
        tmp = []
        index = np.argsort(scores).tolist()
        while len(index) > 0:
            last = len(index) - 1
            i = index[last]
            box1 = boxes[i]
            score = scores[i]

            tmp.append({
                    'box': box1,
                    'score': score
                })

            index.pop(last)
            boxes.pop(i)
            scores.pop(i)

            for j, box2 in enumerate(boxes):
                iou = calc_iou(box1, box2)
                if iou > threshold:
                    scores[j] *= (1-iou)
            index = np.argsort(scores).tolist()
        result.append(tmp)
    return result

